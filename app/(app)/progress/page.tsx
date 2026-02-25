import { createClient } from '@/lib/supabase/server'
import { Subject, StudySession, QuestionAttempt } from '@/types'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { ProgressStats } from '@/components/progress/ProgressStats'

export default async function ProgressPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: subjects }, { data: sessions }, { data: attempts }] = await Promise.all([
    supabase.from('subjects').select('*').eq('user_id', user!.id).eq('is_archived', false),
    supabase
      .from('study_sessions')
      .select('*, subject:subjects(name, color)')
      .eq('user_id', user!.id)
      .order('scheduled_date', { ascending: false }),
    supabase
      .from('question_attempts')
      .select('*')
      .eq('user_id', user!.id)
      .order('attempted_at', { ascending: false })
      .limit(100),
  ])

  const allSessions = (sessions as StudySession[]) ?? []
  const allAttempts = (attempts as QuestionAttempt[]) ?? []
  const allSubjects = (subjects as Subject[]) ?? []

  // Progress per subject
  const subjectProgress = allSubjects.map(subject => {
    const subSessions = allSessions.filter(s => s.subject_id === subject.id)
    const completed = subSessions.filter(s => s.is_completed).length
    const total = subSessions.length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { subject, completed, total, pct }
  })

  // Weekly hours (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const hours = allSessions
      .filter(s => s.is_completed && s.completed_at?.startsWith(dateStr))
      .reduce((sum, s) => sum + s.duration_hours, 0)
    return { date: format(date, 'EEE', { locale: es }), hours }
  })

  // Streak calculation
  let streak = 0
  let checkDate = new Date()
  checkDate.setHours(0, 0, 0, 0)

  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd')
    const hadSession = allSessions.some(s => s.is_completed && s.completed_at?.startsWith(dateStr))
    if (!hadSession) break
    streak++
    checkDate = subDays(checkDate, 1)
  }

  // Quiz stats
  const totalAttempts = allAttempts.length
  const correctAttempts = allAttempts.filter(a => a.is_correct).length
  const quizScore = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Mi progreso</h1>

      <ProgressStats
        subjectProgress={subjectProgress}
        weeklyHours={last7}
        streak={streak}
        totalSessions={allSessions.filter(s => s.is_completed).length}
        quizScore={quizScore}
        totalAttempts={totalAttempts}
      />
    </div>
  )
}
