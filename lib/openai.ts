import OpenAI from 'openai'

// Groq tiene API 100% compatible con OpenAI — solo cambia baseURL y modelo
export const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

export const AI_MODEL = 'llama-3.3-70b-versatile'

export async function summarizeContent(content: string, title: string): Promise<string> {
  const truncated = content.slice(0, 8000)

  const res = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: `Eres un asistente académico. Resume el siguiente material de estudio de manera estructurada, extrayendo los conceptos, temas y subtemas más importantes. El resumen debe ser en español, claro y completo, sin perder información clave. Máximo 2000 palabras.`,
      },
      {
        role: 'user',
        content: `Material: "${title}"\n\n${truncated}`,
      },
    ],
    max_tokens: 2000,
    temperature: 0.3,
  })

  return res.choices[0].message.content ?? ''
}
