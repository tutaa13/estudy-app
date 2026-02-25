import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 365]

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, last_study_date, streak_freeze_count')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 })
  }

  const todayUTC = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const lastStudy = profile.last_study_date as string | null

  // Already updated today — return current state without changes
  if (lastStudy === todayUTC) {
    return NextResponse.json({
      streak: profile.current_streak,
      longest: profile.longest_streak,
      milestone: null,
      freeze_used: false,
      freeze_count: profile.streak_freeze_count,
    })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0]

  let newStreak = profile.current_streak
  let freezeUsed = false
  let newFreezeCount = profile.streak_freeze_count

  if (lastStudy === yesterdayStr) {
    // Perfect — streak continues
    newStreak = profile.current_streak + 1
  } else if (lastStudy === twoDaysAgoStr && profile.streak_freeze_count > 0) {
    // Missed 1 day but has a freeze — preserve streak
    newStreak = profile.current_streak + 1
    newFreezeCount = profile.streak_freeze_count - 1
    freezeUsed = true
  } else {
    // Streak resets
    newStreak = 1
  }

  // Award 1 freeze every 7 days of streak (cap at 3)
  if (newStreak % 7 === 0 && newFreezeCount < 3) {
    newFreezeCount = Math.min(newFreezeCount + 1, 3)
  }

  const newLongest = Math.max(newStreak, profile.longest_streak)

  // Check if this is a milestone
  const prevStreak = profile.current_streak
  const milestone = STREAK_MILESTONES.find(
    m => newStreak >= m && prevStreak < m
  ) ?? null

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

  return NextResponse.json({
    streak: newStreak,
    longest: newLongest,
    milestone,
    freeze_used: freezeUsed,
    freeze_count: newFreezeCount,
  })
}
