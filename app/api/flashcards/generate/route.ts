import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai, AI_MODEL } from '@/lib/openai'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { subject_id, count = 10 } = await req.json()
    if (!subject_id) return NextResponse.json({ error: 'subject_id requerido.' }, { status: 400 })

    const { data: subject } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subject_id)
      .eq('user_id', user.id)
      .single()

    if (!subject) return NextResponse.json({ error: 'Materia no encontrada.' }, { status: 404 })

    const { data: materials } = await supabase
      .from('materials')
      .select('title, processed_content')
      .eq('subject_id', subject_id)
      .eq('status', 'ready')

    let contentContext = ''
    for (const mat of materials ?? []) {
      const chunk = `### ${mat.title}\n${mat.processed_content ?? ''}\n\n`
      if (contentContext.length + chunk.length > 20000) break
      contentContext += chunk
    }

    if (!contentContext) {
      contentContext = `Usá conocimiento general sobre: ${subject.name}`
    }

    const prompt = `Creá exactamente ${count} flashcards de estudio para la materia "${subject.name}".

CONTENIDO DE REFERENCIA:
${contentContext}

INSTRUCCIONES:
- Cada flashcard debe cubrir un concepto, definición, fórmula o idea clave del material
- El "front" es la pregunta o concepto a recordar (conciso, claro)
- El "back" es la respuesta completa o explicación (2-4 oraciones)
- Las opciones son 4 alternativas para el modo multiple choice (solo una correcta)
- "correct" es la letra de la opción correcta: "a", "b", "c" o "d"
- Las opciones incorrectas deben ser plausibles pero claramente erróneas
- Cubrí una variedad de temas del material, de fundamentales a avanzados
- Todo en español
- Respondé ÚNICAMENTE con el JSON, sin texto adicional

FORMATO JSON ESTRICTO:
{
  "flashcards": [
    {
      "front": "Pregunta o concepto",
      "back": "Respuesta completa o explicación del concepto",
      "options": {
        "a": "Opción correcta",
        "b": "Opción incorrecta 1",
        "c": "Opción incorrecta 2",
        "d": "Opción incorrecta 3"
      },
      "correct": "a"
    }
  ]
}`

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'Sos un profesor experto que crea material de repaso de alta calidad.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    const rawJson = response.choices[0].message.content ?? '{}'
    let parsed: { flashcards: { front: string; back: string; options: Record<string, string>; correct: string }[] }

    try {
      parsed = JSON.parse(rawJson)
    } catch {
      return NextResponse.json({ error: 'La IA devolvió un formato inválido. Intentá de nuevo.' }, { status: 500 })
    }

    if (!parsed.flashcards?.length) {
      return NextResponse.json({ error: 'No se generaron flashcards. Intentá de nuevo.' }, { status: 500 })
    }

    return NextResponse.json({ flashcards: parsed.flashcards })
  } catch (err) {
    console.error('Flashcard generation error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
