import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai, AI_MODEL } from '@/lib/openai'
import { AIQuestion, GenerateQuestionsPayload } from '@/types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body: GenerateQuestionsPayload = await req.json()
    const { subject_id, material_id, type, difficulty, count } = body

    if (!subject_id || !type || !difficulty || !count) {
      return NextResponse.json({ error: 'Parámetros incompletos.' }, { status: 400 })
    }

    // Get subject
    const { data: subject } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subject_id)
      .eq('user_id', user.id)
      .single()

    if (!subject) return NextResponse.json({ error: 'Materia no encontrada.' }, { status: 404 })

    // Get materials content
    let query = supabase
      .from('materials')
      .select('title, processed_content')
      .eq('subject_id', subject_id)
      .eq('status', 'ready')

    if (material_id) {
      query = query.eq('id', material_id)
    }

    const { data: materials } = await query

    let contentContext = ''
    const materialDbId: string | null = material_id ?? null

    for (const mat of materials ?? []) {
      const chunk = `### ${mat.title}\n${mat.processed_content ?? ''}\n\n`
      if (contentContext.length + chunk.length > 30000) break
      contentContext += chunk
    }

    if (!contentContext) {
      contentContext = `Usá conocimiento general sobre la materia: ${subject.name}`
    }

    const difficultyLabel = {
      easy: 'fácil (conceptos básicos, definiciones)',
      medium: 'media (comprensión y aplicación de conceptos)',
      hard: 'difícil (análisis, síntesis, casos complejos)',
    }[difficulty]

    const typeInstruction = {
      multiple_choice: `Preguntas de opción múltiple con 4 opciones (a, b, c, d). Solo una es correcta.
El campo "options" debe ser {"a": "opción 1", "b": "opción 2", "c": "opción 3", "d": "opción 4"}
El campo "correct_answer" debe ser la letra: "a", "b", "c" o "d".`,
      short_answer: `Preguntas de respuesta corta. El campo "options" debe ser null.
El campo "correct_answer" debe ser la respuesta correcta en 1-3 oraciones.`,
      true_false: `Preguntas de verdadero/falso. El campo "options" debe ser {"a": "Verdadero", "b": "Falso"}.
El campo "correct_answer" debe ser "a" para Verdadero o "b" para Falso.`,
    }[type]

    const prompt = `Generá exactamente ${count} preguntas de práctica sobre "${subject.name}".

TIPO: ${type === 'multiple_choice' ? 'Opción múltiple' : type === 'short_answer' ? 'Respuesta corta' : 'Verdadero/Falso'}
DIFICULTAD: ${difficultyLabel}

CONTENIDO DE REFERENCIA:
${contentContext}

INSTRUCCIONES PARA EL TIPO:
${typeInstruction}

El campo "explanation" debe explicar por qué la respuesta es correcta (2-3 oraciones).
Todas las preguntas en español.
Respondé ÚNICAMENTE con el JSON, sin texto adicional.

FORMATO (JSON estricto):
{
  "questions": [
    {
      "type": "${type}",
      "difficulty": "${difficulty}",
      "question_text": "...",
      "options": {...} or null,
      "correct_answer": "...",
      "explanation": "..."
    }
  ]
}`

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'Sos un profesor experto que genera preguntas de evaluación de alta calidad.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    })

    const rawJson = response.choices[0].message.content ?? '{}'
    let parsed: { questions: AIQuestion[] }

    try {
      parsed = JSON.parse(rawJson)
    } catch {
      return NextResponse.json({ error: 'La IA devolvió un formato inválido.' }, { status: 500 })
    }

    if (!parsed.questions?.length) {
      return NextResponse.json({ error: 'No se generaron preguntas. Intentá de nuevo.' }, { status: 500 })
    }

    // Save questions to DB
    const toInsert = parsed.questions.map(q => ({
      subject_id,
      material_id: materialDbId,
      user_id: user.id,
      type: q.type,
      difficulty: q.difficulty,
      question_text: q.question_text,
      options: q.options ?? null,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }))

    const { data: savedQuestions, error: insertError } = await supabase
      .from('questions')
      .insert(toInsert)
      .select()

    if (insertError) {
      return NextResponse.json({ error: 'Error al guardar preguntas.' }, { status: 500 })
    }

    return NextResponse.json({ questions: savedQuestions })
  } catch (err) {
    console.error('Question generation error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
