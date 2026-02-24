import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Subject, StudyPlan, StudySession } from '@/types'
import { GeneratePlanButton } from '@/components/plan/GeneratePlanButton'
import { StudyCalendarWrapper } from '@/components/plan/StudyCalendarWrapper'

interface Props {
  params: { id: string }
}

export default async function PlanPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: subject }, { data: plans }] = await Promise.all([
    supabase.from('subjects').select('*').eq('id', params.id).eq('user_id', user!.id).single(),
    supabase.from('study_plans').select('*').eq('subject_id', params.id).eq('user_id', user!.id).eq('is_active', true).limit(1),
  ])

  if (!subject) notFound()

  const sub = subject as Subject
  const activePlan = plans?.[0] as StudyPlan | undefined

  let sessions: StudySession[] = []
  if (activePlan) {
    const { data } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('plan_id', activePlan.id)
      .order('scheduled_date', { ascending: true })
    sessions = (data as StudySession[]) ?? []
  }

  const completedCount = sessions.filter(s => s.is_completed).length
  const progressPct = sessions.length > 0 ? Math.round((completedCount / sessions.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/subjects/${params.id}`} className="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan de estudio</h1>
          <p className="text-sm text-gray-500">{sub.name}</p>
        </div>
      </div>

      {/* Generate plan button */}
      <GeneratePlanButton
        subjectId={sub.id}
        hasPlan={!!activePlan}
        subjectColor={sub.color}
      />

      {/* Progress */}
      {activePlan && sessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso del plan</span>
            <span className="text-sm font-bold text-indigo-700">{progressPct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: sub.color }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {completedCount} de {sessions.length} sesiones completadas · {activePlan.total_hours}hs totales
          </p>
        </div>
      )}

      {/* Calendar */}
      {sessions.length > 0 && (
        <StudyCalendarWrapper sessions={sessions} subjectColor={sub.color} />
      )}

      {!activePlan && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">
            Hacé click en &quot;Generar plan&quot; para que la IA cree un plan de estudio personalizado basado en tus materiales.
          </p>
        </div>
      )}
    </div>
  )
}
