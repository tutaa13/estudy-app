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
          <h1 className="text-2xl font-bold text-foreground">Panel principal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formatDate(new Date())}</p>
        </div>
        <Link
          href="/subjects/new"
          className="flex items-center gap-2 rounded-lg bg-violet-600 text-white text-sm font-medium px-4 py-2 hover:bg-violet-700 transition"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Materias activas', value: activeSubjects.length, icon: BookMarked, color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
          { label: 'Sesiones hoy', value: sessions.length, icon: Clock, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
          { label: 'Completadas hoy', value: completedToday, icon: CheckCircle2, color: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400' },
          { label: 'Pendientes hoy', value: sessions.length - completedToday, icon: AlertCircle, color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4">
            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${color} mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Today's sessions */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-semibold text-foreground mb-4">Sesiones de hoy</h2>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No tenés sesiones programadas para hoy.</p>
            <Link href="/subjects" className="text-violet-600 dark:text-violet-400 text-sm font-medium hover:underline mt-2 inline-block">
              Ir a mis materias →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition ${
                  session.is_completed
                    ? 'border-green-200/60 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20'
                    : 'border-border hover:border-violet-200 dark:hover:border-violet-800'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: session.subject?.color ?? '#7c3aed' }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${session.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {session.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {session.subject?.name} · {session.duration_hours}hs
                  </p>
                </div>
                {session.is_completed && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming exams */}
      {activeSubjects.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Próximos exámenes</h2>
          <div className="space-y-1">
            {activeSubjects.slice(0, 5).map((subject) => {
              const days = daysUntilExam(subject.exam_date)
              const urgency = days <= 7
                ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40'
                : days <= 14
                  ? 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/40'
                  : 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/40'
              return (
                <Link
                  key={subject.id}
                  href={`/subjects/${subject.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-foreground">{subject.name}</span>
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
        <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
          <BookMarked className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No tenés materias todavía</h3>
          <p className="text-sm text-muted-foreground mb-5">Creá tu primera materia para empezar a planificar</p>
          <Link
            href="/subjects/new"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-violet-700 transition"
          >
            <Plus className="w-4 h-4" />
            Crear primera materia
          </Link>
        </div>
      )}
    </div>
  )
}
