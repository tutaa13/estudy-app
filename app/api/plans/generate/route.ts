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

    const systemPrompt = `Eres un experto en pedagogía y planificación de estudios. Generás planes de estudio detallados y personalizados basados en el contenido real de los materiales.`

    const userPrompt = `Generá un plan de estudio completo para la materia "${subject.name}".

DATOS:
- Fecha de hoy: ${todayStr}
- Fecha del examen: ${examDateStr}
- Días disponibles: ${daysAvailable}
- Horas de estudio disponibles por día: ${subject.hours_per_day}
- Materiales de estudio disponibles: ${noMaterials ? 'Ninguno (usar temario estándar de la materia)' : `${mats.length} material(es)`}

MATERIALES:
${materialsSection}

INSTRUCCIONES:
- Distribuí el contenido de los materiales en sesiones de estudio diarias
- Cada sesión debe tener una duración aproximada de ${subject.hours_per_day} horas
- Empezar desde ${todayStr} (o el día siguiente) hasta ${examDateStr} (exclusive)
- Los últimos 1-2 días antes del examen deben ser de repaso general
- Cada sesión debe tener: un título claro, descripción de qué estudiar y cómo, y lista de temas específicos
- Distribuir de lo más básico a lo más complejo
- NO incluyas el día del examen
- Respondé ÚNICAMENTE con el JSON, sin texto adicional, sin markdown

FORMATO DE RESPUESTA (JSON estricto):
{
  "sessions": [
    {
      "date": "YYYY-MM-DD",
      "duration_hours": ${subject.hours_per_day},
      "title": "Título de la sesión",
      "description": "Descripción detallada de qué estudiar y cómo abordarlo",
      "topics": ["Tema 1", "Tema 2", "Tema 3"]
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
      max_tokens: 4000,
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
