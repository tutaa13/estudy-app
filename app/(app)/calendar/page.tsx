import { createClient } from '@/lib/supabase/server'
import { StudySession, Subject } from '@/types'
import { GlobalCalendar } from '@/components/plan/GlobalCalendar'

export default async function CalendarPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: sessions }, { data: subjects }] = await Promise.all([
    supabase
      .from('study_sessions')
      .select('*, subject:subjects(name, color)')
      .eq('user_id', user!.id)
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('subjects')
      .select('id, name, color')
      .eq('user_id', user!.id)
      .eq('is_archived', false),
  ])

  const allSessions = (sessions as StudySession[]) ?? []
  const allSubjects = (subjects as Subject[]) ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Calendario de estudio</h1>
      <GlobalCalendar sessions={allSessions} subjects={allSubjects} />
    </div>
  )
}
