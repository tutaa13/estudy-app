import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { notes, completed } = await req.json().catch(() => ({}))

  const update: Record<string, unknown> = {
    is_completed: completed !== false,
    completed_at: completed !== false ? new Date().toISOString() : null,
  }

  if (notes !== undefined) update.notes = notes

  const { error } = await supabase
    .from('study_sessions')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Error al actualizar.' }, { status: 500 })

  // Update streak when completing a session (fire and return result)
  let streakData = null
  if (completed !== false) {
    const todayUTC = new Date().toISOString().split('T')[0]
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_study_date, streak_freeze_count')
      .eq('id', user.id)
      .single()

    if (profile && profile.last_study_date !== todayUTC) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0]

      let newStreak = profile.current_streak
      let freezeUsed = false
      let newFreezeCount = profile.streak_freeze_count

      if (profile.last_study_date === yesterdayStr) {
        newStreak = profile.current_streak + 1
      } else if (profile.last_study_date === twoDaysAgoStr && profile.streak_freeze_count > 0) {
        newStreak = profile.current_streak + 1
        newFreezeCount = profile.streak_freeze_count - 1
        freezeUsed = true
      } else {
        newStreak = 1
      }

      if (newStreak % 7 === 0 && newFreezeCount < 3) {
        newFreezeCount = Math.min(newFreezeCount + 1, 3)
      }

      const newLongest = Math.max(newStreak, profile.longest_streak)
      const MILESTONES = [3, 7, 14, 30, 50, 100, 365]
      const milestone = MILESTONES.find(m => newStreak >= m && profile.current_streak < m) ?? null

      await supabase
        .from('profiles')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_study_date: todayUTC,
          streak_freeze_count: newFreezeCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      streakData = { streak: newStreak, longest: newLongest, milestone, freeze_used: freezeUsed, freeze_count: newFreezeCount }
    } else if (profile) {
      streakData = { streak: profile.current_streak, longest: profile.longest_streak, milestone: null, freeze_used: false, freeze_count: profile.streak_freeze_count }
    }
  }

  return NextResponse.json({ success: true, streak: streakData })
}
