'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import { FlashcardDeck } from '@/components/flashcards/FlashcardDeck'

const COUNT_OPTIONS = [5, 10, 15, 20]

interface Flashcard {
  front: string
  back: string
  options: Record<string, string>
  correct: string
}

export default function FlashcardsPage() {
  const params = useParams()
  const subjectId = params.id as string

  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null)
  const [subjectColor] = useState('#6366f1')

  async function generate() {
    setError('')
    setLoading(true)
    setFlashcards(null)

    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subjectId, count }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al generar flashcards.')
      } else {
        setFlashcards(data.flashcards)
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/subjects/${subjectId}`} className="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
          <p className="text-sm text-gray-500">Repaso con tarjetas generadas por IA</p>
        </div>
      </div>

      {/* Generator */}
      {!flashcards && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">¿Cuántas flashcards querés?</p>
            <div className="flex gap-2">
              {COUNT_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition ${
                    count === n
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={generate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando flashcards...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generar {count} flashcards con IA
              </>
            )}
          </button>
        </div>
      )}

      {/* Deck */}
      {flashcards && (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <FlashcardDeck flashcards={flashcards} subjectColor={subjectColor} />
          </div>
          <button
            onClick={() => setFlashcards(null)}
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition"
          >
            Generar nuevas flashcards
          </button>
        </>
      )}
    </div>
  )
}
