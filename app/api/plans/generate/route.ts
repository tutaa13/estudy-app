import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai, AI_MODEL } from '@/lib/openai'
import { differenceInDays, format } from 'date-fns'
import { AIStudyPlan } from '@/types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { subject_id } = await req.json()
    if (!subject_id) return NextResponse.json({ error: 'subject_id requerido.' }, { status: 400 })

    // Get subject
    const { data: subject } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subject_id)
      .eq('user_id', user.id)
      .single()

    if (!subject) return NextResponse.json({ error: 'Materia no encontrada.' }, { status: 404 })

    // Get ready materials
    const { data: materials } = await supabase
      .from('materials')
      .select('title, processed_content, type')
      .eq('subject_id', subject_id)
      .eq('status', 'ready')

    // Calculate days available
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const examDate = new Date(subject.exam_date)
    const daysAvailable = differenceInDays(examDate, today)

    if (daysAvailable <= 0) {
      return NextResponse.json({ error: 'La fecha del examen ya pasó.' }, { status: 400 })
    }

    // Build materials context (limit to ~12k tokens ≈ 48k chars)
    let materialsContext = ''
    const mats = materials ?? []
    let charCount = 0
    const MAX_CHARS = 40000

    for (const mat of mats) {
      const content = mat.processed_content ?? ''
      const chunk = `\n\n### ${mat.title} (${mat.type})\n${content}`
      if (charCount + chunk.length > MAX_CHARS) break
      materialsContext += chunk
      charCount += chunk.length
    }

    const noMaterials = mats.length === 0
    const materialsSection = noMaterials
      ? 'No hay materiales cargados. Crea un plan general basado en el nombre de la materia.'
      : materialsContext

    // Generate plan with AI
    const todayStr = format(today, 'yyyy-MM-dd')
    const examDateStr = format(examDate, 'yyyy-MM-dd')

    const reviewDays = daysAvailable <= 5 ? 1 : 2

    const systemPrompt = `Sos un experto en pedagogía y aprendizaje acelerado. Tu especialidad es crear planes de estudio altamente personalizados, progresivos y accionables basados en el contenido real que tiene el alumno.`

    const userPrompt = `Creá un plan de estudio detallado para la materia "${subject.name}".

DATOS DEL ALUMNO:
- Fecha de hoy: ${todayStr}
- Fecha del examen: ${examDateStr}
- Días disponibles para estudiar: ${daysAvailable}
- Horas de estudio por día: ${subject.hours_per_day}
- Materiales cargados: ${noMaterials ? 'Ninguno' : `${mats.length} material(es)`}

MATERIALES DEL ALUMNO:
${materialsSection}

PROCESO PARA GENERAR EL PLAN:

PASO 1 - ANALIZÁ EL CONTENIDO:
Identificá TODOS los conceptos, definiciones, teorías, fórmulas y procedimientos presentes en los materiales.
Clasificalos en tres niveles:
- FUNDAMENTALES: conceptos base sin los cuales no se puede entender el resto
- INTERMEDIOS: conceptos que dependen de los fundamentales
- AVANZADOS: conceptos complejos que dependen de los anteriores

PASO 2 - DISEÑÁ LA PROGRESIÓN:
- Empezá SIEMPRE por los conceptos fundamentales (día 1 y 2)
- Avanzá hacia los intermedios, luego los avanzados
- Agrupá en cada sesión temas que tienen coherencia entre sí
- Los últimos ${reviewDays} día(s) antes del examen: repaso integral y ejercicios de práctica
- No incluyas el día ${examDateStr} (día del examen)
- Las sesiones empiezan desde ${todayStr} en adelante, una por día

PASO 3 - ESCRIBÍ CADA SESIÓN CON MÁXIMO DETALLE:
- Título: específico con los temas reales del material (NUNCA escribas "Sesión 1" o "Introducción" genérica)
- Descripción: indicá QUÉ hacer exactamente en esa sesión (leer sección X, hacer resumen de Y, resolver ejercicios de Z, crear mapa conceptual de W). Mencioná conceptos específicos del material.
- Topics: listá los conceptos exactos a estudiar, extraídos textualmente del material

REGLAS IMPORTANTES:
- Cada sesión dura exactamente ${subject.hours_per_day} hora(s)
- Los títulos deben reflejar el contenido real, no ser genéricos
- Las descripciones deben ser instrucciones concretas de qué hacer (verbos de acción)
- Los topics deben ser términos/conceptos reales del material, no categorías vagas
- Respondé ÚNICAMENTE con el JSON, sin texto adicional, sin markdown

FORMATO JSON ESTRICTO:
{
  "sessions": [
    {
      "date": "YYYY-MM-DD",
      "duration_hours": ${subject.hours_per_day},
      "title": "Título específico con temas reales",
      "description": "Instrucciones concretas de qué hacer en esta sesión: leer X, resumir Y, practicar Z...",
      "topics": ["Concepto específico 1", "Concepto específico 2", "Concepto específico 3"]
    }
  ]
}`

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
    })

    const rawJson = response.choices[0].message.content ?? '{}'
    let plan: AIStudyPlan

    try {
      plan = JSON.parse(rawJson)
    } catch {
      return NextResponse.json({ error: 'La IA devolvió un formato inválido. Intentá de nuevo.' }, { status: 500 })
    }

    if (!plan.sessions || !Array.isArray(plan.sessions) || plan.sessions.length === 0) {
      return NextResponse.json({ error: 'No se pudieron generar sesiones. Intentá de nuevo.' }, { status: 500 })
    }

    // Deactivate existing plans for this subject
    await supabase
      .from('study_plans')
      .update({ is_active: false })
      .eq('subject_id', subject_id)
      .eq('user_id', user.id)

    // Create new plan
    const totalHours = plan.sessions.reduce((sum, s) => sum + (s.duration_hours ?? subject.hours_per_day), 0)

    const { data: newPlan, error: planError } = await supabase
      .from('study_plans')
      .insert({
        subject_id,
        user_id: user.id,
        is_active: true,
        total_days: plan.sessions.length,
        total_hours: totalHours,
      })
      .select()
      .single()

    if (planError) {
      return NextResponse.json({ error: 'Error al guardar el plan.' }, { status: 500 })
    }

    // Create sessions
    const sessionsToInsert = plan.sessions.map(session => ({
      plan_id: newPlan.id,
      subject_id,
      user_id: user.id,
      scheduled_date: session.date,
      duration_hours: session.duration_hours ?? subject.hours_per_day,
      title: session.title,
      description: session.description,
      topics: session.topics ?? [],
      is_completed: false,
    }))

    const { error: sessionsError } = await supabase
      .from('study_sessions')
      .insert(sessionsToInsert)

    if (sessionsError) {
      return NextResponse.json({ error: 'Error al guardar las sesiones.' }, { status: 500 })
    }

    return NextResponse.json({ plan: newPlan, sessionsCount: sessionsToInsert.length })
  } catch (err) {
    console.error('Plan generation error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
