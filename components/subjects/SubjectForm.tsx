'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SUBJECT_COLORS } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { Subject } from '@/types'

interface Props {
  subject?: Subject
}

export function SubjectForm({ subject }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(subject?.name ?? '')
  const [description, setDescription] = useState(subject?.description ?? '')
  const [examDate, setExamDate] = useState(subject?.exam_date ?? '')
  const [hoursPerDay, setHoursPerDay] = useState(subject?.hours_per_day?.toString() ?? '2')
  const [color, setColor] = useState(subject?.color ?? SUBJECT_COLORS[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      name,
      description: description || null,
      exam_date: examDate,
      hours_per_day: parseFloat(hoursPerDay),
      color,
      user_id: user.id,
    }

    let err
    if (subject) {
      const res = await supabase.from('subjects').update(payload).eq('id', subject.id)
      err = res.error
    } else {
      const res = await supabase.from('subjects').insert(payload).select().single()
      err = res.error
      if (!err) {
        router.push(`/subjects/${res.data.id}`)
        return
      }
    }

    if (err) {
      setError('Ocurrió un error. Intentá de nuevo.')
      setLoading(false)
      return
    }

    router.push('/subjects')
    router.refresh()
  }

  // Get tomorrow's date as min for exam_date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Nombre de la materia *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Cálculo II, Historia Argentina..."
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Descripción <span className="text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Temas generales, notas adicionales..."
            rows={2}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition resize-none"
          />
        </div>

        {/* Exam date + hours per day */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Fecha del examen *
            </label>
            <input
              type="date"
              required
              min={minDate}
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Horas disponibles por día *
            </label>
            <input
              type="number"
              required
              min="0.5"
              max="12"
              step="0.5"
              value={hoursPerDay}
              onChange={e => setHoursPerDay(e.target.value)}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition"
            />
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Color identificador
          </label>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition ${
                  color === c ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-xl border border-border text-muted-foreground font-medium py-2.5 text-sm hover:bg-muted transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white font-medium py-2.5 text-sm hover:bg-violet-700 disabled:opacity-60 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {subject ? 'Guardar cambios' : 'Crear materia'}
          </button>
        </div>
      </form>
    </div>
  )
}
