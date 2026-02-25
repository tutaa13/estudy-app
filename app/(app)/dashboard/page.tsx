import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, BookMarked, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { daysUntilExam, formatDate } from '@/lib/utils'
import { Subject, StudySession } from '@/types'
import { StreakCard } from '@/components/dashboard/StreakCard'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: subjects }, { data: todaySessions }, { data: profile }] = await Promise.all([
    supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_archived', false)
      .order('exam_date', { ascending: true }),
    supabase
      .from('study_sessions')
      .select('*, subject:subjects(name, color)')
      .eq('user_id', user!.id)
      .eq('scheduled_date', new Date().toISOString().split('T')[0])
      .order('created_at'),
    supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_study_date, streak_freeze_count')
      .eq('id', user!.id)
      .single(),
  ])

  const activeSubjects = (subjects as Subject[]) ?? []
  const sessions = (todaySessions as StudySession[]) ?? []
  const completedToday = sessions.filter(s => s.is_completed).length
  const streak = profile ?? { current_streak: 0, longest_streak: 0, last_study_date: null, streak_freeze_count: 1 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel principal</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(new Date())}</p>
        </div>
        <Link
          href="/subjects/new"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nueva materia
        </Link>
      </div>

      {/* Streak */}
      <StreakCard
        currentStreak={streak.current_streak}
        longestStreak={streak.longest_streak}
        lastStudyDate={streak.last_study_date}
        freezeCount={streak.streak_freeze_count}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Materias activas', value: activeSubjects.length, icon: BookMarked, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Sesiones hoy', value: sessions.length, icon: Clock, color: 'bg-blue-50 text-blue-600' },
          { label: 'Completadas hoy', value: completedToday, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
          { label: 'Pendientes hoy', value: sessions.length - completedToday, icon: AlertCircle, color: 'bg-orange-50 text-orange-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${color} mb-3`}>
              <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Today's sessions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Sesiones de hoy</h2>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No tenés sesiones programadas para hoy.</p>
            <Link href="/subjects" className="text-indigo-600 text-sm font-medium hover:underline mt-2 inline-block">
              Ir a mis materias →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition ${
                  session.is_completed ? 'border-green-100 bg-green-50' : 'border-gray-100 hover:border-indigo-100'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: session.subject?.color ?? '#6366f1' }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${session.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {session.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {session.subject?.name} · {session.duration_hours}hs
                  </p>
                </div>
                {session.is_completed && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming exams */}
      {activeSubjects.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Próximos exámenes</h2>
          <div className="space-y-3">
            {activeSubjects.slice(0, 5).map((subject) => {
              const days = daysUntilExam(subject.exam_date)
              const urgency = days <= 7 ? 'text-red-600 bg-red-50' : days <= 14 ? 'text-orange-600 bg-orange-50' : 'text-indigo-600 bg-indigo-50'
              return (
                <Link
                  key={subject.id}
                  href={`/subjects/${subject.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900">{subject.name}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${urgency}`}>
                    {days < 0 ? 'Vencido' : days === 0 ? '¡Hoy!' : `${days} días`}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {activeSubjects.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <BookMarked className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">No tenés materias todavía</h3>
          <p className="text-sm text-gray-500 mb-5">Creá tu primera materia para empezar a planificar</p>
          <Link
            href="/subjects/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Crear primera materia
          </Link>
        </div>
      )}
    </div>
  )
}
