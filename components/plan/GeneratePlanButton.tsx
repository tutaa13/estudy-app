'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'

interface Props {
  subjectId: string
  hasPlan: boolean
  subjectColor: string
}

export function GeneratePlanButton({ subjectId, hasPlan, subjectColor }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleGenerate() {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subjectId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al generar el plan.')
      } else {
        router.refresh()
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${subjectColor}20` }}>
          <Sparkles className="w-5 h-5" style={{ color: subjectColor }} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-0.5">
            {hasPlan ? 'Plan generado con IA' : 'Generá tu plan de estudio'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasPlan
              ? 'Ya tenés un plan activo. Podés regenerarlo si actualizaste tus materiales o la fecha de examen.'
              : 'La IA analiza todos tus materiales y distribuye el contenido día a día hasta la fecha del examen.'}
          </p>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl text-white text-sm font-medium px-4 py-2.5 hover:opacity-90 disabled:opacity-60 transition flex-shrink-0"
          style={{ backgroundColor: subjectColor }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
          ) : hasPlan ? (
            <><RefreshCw className="w-4 h-4" /> Regenerar</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generar plan</>
          )}
        </button>
      </div>
    </div>
  )
}
