import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { summarizeContent } from '@/lib/openai'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const formData = await req.formData()
    const subjectId = formData.get('subject_id') as string
    const type = formData.get('type') as string

    if (!subjectId || !type) {
      return NextResponse.json({ error: 'Faltan parámetros.' }, { status: 400 })
    }

    // Verify subject belongs to user
    const { data: subject } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', subjectId)
      .eq('user_id', user.id)
      .single()

    if (!subject) return NextResponse.json({ error: 'Materia no encontrada.' }, { status: 404 })

    let title = ''
    let rawContent = ''
    let storagePath: string | null = null
    let sourceUrl: string | null = null
    let fileSizeBytes: number | null = null

    if (type === 'pdf') {
      const file = formData.get('file') as File
      if (!file) return NextResponse.json({ error: 'Archivo requerido.' }, { status: 400 })

      title = (formData.get('title') as string) || file.name
      fileSizeBytes = file.size

      // Upload to Supabase Storage
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const fileName = `${user.id}/${subjectId}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(fileName, fileBuffer, { contentType: 'application/pdf' })

      if (uploadError) {
        return NextResponse.json({ error: 'Error al subir el archivo.' }, { status: 500 })
      }

      storagePath = fileName

      // Extract text from PDF
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse')
        const pdfData = await pdfParse(fileBuffer)
        rawContent = pdfData.text
      } catch {
        rawContent = '[No se pudo extraer texto del PDF]'
      }

    } else if (type === 'image') {
      const file = formData.get('file') as File
      if (!file) return NextResponse.json({ error: 'Imagen requerida.' }, { status: 400 })

      title = (formData.get('title') as string) || file.name
      fileSizeBytes = file.size

      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const fileName = `${user.id}/${subjectId}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(fileName, fileBuffer, { contentType: file.type })

      if (uploadError) {
        return NextResponse.json({ error: 'Error al subir la imagen.' }, { status: 500 })
      }

      storagePath = fileName

      // OCR with Tesseract
      try {
        const Tesseract = await import('tesseract.js')
        const { data: { text } } = await Tesseract.recognize(fileBuffer, 'spa+eng')
        rawContent = text
      } catch {
        rawContent = '[No se pudo extraer texto de la imagen]'
      }

    } else if (type === 'youtube') {
      const url = formData.get('url') as string
      if (!url) return NextResponse.json({ error: 'URL requerida.' }, { status: 400 })

      sourceUrl = url
      title = (formData.get('title') as string) || 'Video de YouTube'

      // Get transcript
      try {
        const { YoutubeTranscript } = await import('youtube-transcript')
        const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
        const videoId = videoIdMatch?.[1]

        if (!videoId) {
          return NextResponse.json({ error: 'URL de YouTube inválida.' }, { status: 400 })
        }

        const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'es' })
          .catch(() => YoutubeTranscript.fetchTranscript(videoId))

        rawContent = transcript.map(t => t.text).join(' ')

        // Try to get video title from transcript first item or use generic title
        if (rawContent.length < 10) {
          rawContent = '[El video no tiene transcripción disponible]'
        }
      } catch {
        rawContent = '[No se pudo obtener la transcripción del video]'
      }

    } else if (type === 'text') {
      title = formData.get('title') as string
      rawContent = formData.get('content') as string
    }

    // Create material record with pending status
    const { data: material, error: insertError } = await supabase
      .from('materials')
      .insert({
        subject_id: subjectId,
        user_id: user.id,
        type,
        title,
        storage_path: storagePath,
        source_url: sourceUrl,
        raw_content: rawContent,
        file_size_bytes: fileSizeBytes,
        status: 'processing',
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Error al guardar el material.' }, { status: 500 })
    }

    // Summarize content with AI (async, update after)
    if (rawContent && rawContent.length > 50 && !rawContent.startsWith('[')) {
      try {
        const processed = await summarizeContent(rawContent, title)
        await supabase
          .from('materials')
          .update({ processed_content: processed, status: 'ready', updated_at: new Date().toISOString() })
          .eq('id', material.id)
      } catch {
        // Use raw content as fallback
        await supabase
          .from('materials')
          .update({
            processed_content: rawContent.slice(0, 12000),
            status: 'ready',
            updated_at: new Date().toISOString(),
          })
          .eq('id', material.id)
      }
    } else {
      await supabase
        .from('materials')
        .update({ processed_content: rawContent, status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', material.id)
    }

    return NextResponse.json({ material }, { status: 201 })
  } catch (err) {
    console.error('Material upload error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
