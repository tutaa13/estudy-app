import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, BookMarked } from 'lucide-react'
import { daysUntilExam, formatDate } from '@/lib/utils'
import { Subject } from '@/types'

export default async function SubjectsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', user!.id)
    .eq('is_archived', false)
    .order('exam_date', { ascending: true })

  const list = (subjects as Subject[]) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Mis materias</h1>
        <Link
          href="/subjects/new"
          className="flex items-center gap-2 rounded-xl bg-violet-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-violet-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nueva materia
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center">
          <BookMarked className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-1">Sin materias activas</h3>
          <p className="text-sm text-muted-foreground mb-5">Creá tu primera materia para empezar</p>
          <Link
            href="/subjects/new"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-violet-700 transition"
          >
            <Plus className="w-4 h-4" />
            Crear materia
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {list.map((subject) => {
            const days = daysUntilExam(subject.exam_date)
            const urgencyClass = days <= 7 ? 'border-red-200 bg-red-50' : days <= 14 ? 'border-orange-200 bg-orange-50' : 'border-border bg-muted'
            const daysLabel = days < 0 ? 'Examen vencido' : days === 0 ? '¡El examen es hoy!' : `${days} días para el examen`

            return (
              <Link
                key={subject.id}
                href={`/subjects/${subject.id}`}
                className="block bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:border-violet-100 transition group"
              >
                {/* Color bar */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-violet-700 transition">
                      {subject.name}
                    </h3>
                    {subject.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{subject.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={`text-xs font-medium px-2.5 py-1 rounded-full inline-block ${urgencyClass}`}>
                    {daysLabel}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Examen: {formatDate(subject.exam_date)}</span>
                    <span>·</span>
                    <span>{subject.hours_per_day}hs/día</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
