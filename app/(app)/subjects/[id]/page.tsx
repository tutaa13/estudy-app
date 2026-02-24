import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Clock, Pencil, BookOpen, Lightbulb } from 'lucide-react'
import { formatDate, daysUntilExam } from '@/lib/utils'
import { Subject, Material } from '@/types'
import { MaterialList } from '@/components/materials/MaterialList'
import { MaterialUploader } from '@/components/materials/MaterialUploader'

interface Props {
  params: { id: string }
}

export default async function SubjectDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: subject }, { data: materials }, { data: plans }] = await Promise.all([
    supabase.from('subjects').select('*').eq('id', params.id).eq('user_id', user!.id).single(),
    supabase.from('materials').select('*').eq('subject_id', params.id).order('created_at', { ascending: false }),
    supabase.from('study_plans').select('*').eq('subject_id', params.id).eq('is_active', true).limit(1),
  ])

  if (!subject) notFound()

  const sub = subject as Subject
  const mats = (materials as Material[]) ?? []
  const hasPlan = (plans?.length ?? 0) > 0
  const days = daysUntilExam(sub.exam_date)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/subjects" className="text-gray-400 hover:text-gray-600 transition mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color }} />
            <h1 className="text-2xl font-bold text-gray-900">{sub.name}</h1>
          </div>
          {sub.description && <p className="text-sm text-gray-500">{sub.description}</p>}
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <CalendarDays className="w-4 h-4" />
              <span>Examen: {formatDate(sub.exam_date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{sub.hours_per_day}hs disponibles por día</span>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              days <= 7 ? 'bg-red-50 text-red-600' : days <= 14 ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
              {days < 0 ? 'Examen vencido' : days === 0 ? '¡Hoy!' : `${days} días`}
            </span>
          </div>
        </div>
        <Link
          href={`/subjects/${sub.id}/edit`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href={`/subjects/${sub.id}/plan`}
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {hasPlan ? 'Ver plan' : 'Generar plan'}
            </p>
            <p className="text-xs text-gray-400">
              {hasPlan ? 'Calendario de estudio' : 'Con IA desde tus materiales'}
            </p>
          </div>
        </Link>

        <Link
          href={`/subjects/${sub.id}/questions`}
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-sm transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition">
            <Lightbulb className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Practicar</p>
            <p className="text-xs text-gray-400">Preguntas generadas por IA</p>
          </div>
        </Link>
      </div>

      {/* Materials */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 w-[18px] h-[18px] text-gray-500" />
            <h2 className="font-semibold text-gray-900">Materiales de estudio</h2>
            <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{mats.length}</span>
          </div>
        </div>
        <MaterialUploader subjectId={sub.id} />
        {mats.length > 0 && <MaterialList materials={mats} />}
      </div>
    </div>
  )
}
