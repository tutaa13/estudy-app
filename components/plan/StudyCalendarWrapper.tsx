'use client'

import { useState } from 'react'
import { StudySession } from '@/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, Circle, ChevronDown, X, Loader2, Flame } from 'lucide-react'
import { PomodoroTimer } from './PomodoroTimer'

interface StreakResult {
  streak: number
  milestone: number | null
  freeze_used: boolean
}

interface Props {
  sessions: StudySession[]
  subjectColor: string
}

export function StudyCalendarWrapper({ sessions, subjectColor }: Props) {
  const [selected, setSelected] = useState<StudySession | null>(null)
  const [sessionState, setSessionState] = useState<Record<string, boolean>>(
    Object.fromEntries(sessions.map(s => [s.id, s.is_completed]))
  )
  const [notes, setNotes] = useState('')
  const [completing, setCompleting] = useState<string | null>(null)
  const [streakResult, setStreakResult] = useState<StreakResult | null>(null)

  // Group sessions by week
  const byWeek: Record<string, StudySession[]> = {}
  for (const session of sessions) {
    const date = parseISO(session.scheduled_date)
    const weekKey = format(date, "'Semana del' d 'de' MMMM", { locale: es })
    if (!byWeek[weekKey]) byWeek[weekKey] = []
    byWeek[weekKey].push(session)
  }

  async function handleToggleComplete(session: StudySession) {
    setCompleting(session.id)
    const newCompleted = !sessionState[session.id]

    const res = await fetch(`/api/sessions/${session.id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: newCompleted }),
    })
    const data = await res.json()
    if (newCompleted && data.streak) setStreakResult(data.streak)

    setSessionState(prev => ({ ...prev, [session.id]: newCompleted }))
    setCompleting(null)
  }

  async function handleCompleteWithNotes() {
    if (!selected) return
    setCompleting(selected.id)

    const res = await fetch(`/api/sessions/${selected.id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true, notes }),
    })
    const data = await res.json()
    if (data.streak) setStreakResult(data.streak)

    setSessionState(prev => ({ ...prev, [selected.id]: true }))
    setNotes('')
    setSelected(null)
    setCompleting(null)
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Sesiones de estudio ({sessions.length} días)</h2>
      </div>

      {/* Session list grouped by week */}
      <div className="space-y-6">
        {Object.entries(byWeek).map(([week, weekSessions]) => (
          <div key={week}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{week}</h3>
            <div className="space-y-2">
              {weekSessions.map((session) => {
                const completed = sessionState[session.id]
                const date = parseISO(session.scheduled_date)
                return (
                  <div
                    key={session.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      completed
                        ? 'border-green-100 bg-green-50'
                        : 'border-border hover:border-violet-100 hover:bg-violet-50/30'
                    }`}
                    onClick={() => { setSelected(session); setNotes('') }}
                  >
                    {/* Toggle complete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleComplete(session) }}
                      disabled={completing === session.id}
                      className="mt-0.5 flex-shrink-0 transition"
                    >
                      {completing === session.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground hover:text-violet-500" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {format(date, "EEEE d MMM", { locale: es })}
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-muted-foreground">{session.duration_hours}hs</span>
                      </div>
                      <p className={`text-sm font-medium mt-0.5 ${completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {session.title}
                      </p>
                      {session.topics && session.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {session.topics.slice(0, 3).map((topic, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${subjectColor}20`, color: subjectColor }}
                            >
                              {topic}
                            </span>
                          ))}
                          {session.topics.length > 3 && (
                            <span className="text-xs text-muted-foreground px-1 py-0.5">+{session.topics.length - 3} más</span>
                          )}
                        </div>
                      )}
                    </div>

                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Streak celebration toast */}
      {streakResult && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
          <div className="bg-gray-900 text-white rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-3 max-w-sm">
            <Flame className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <div className="flex-1">
              {streakResult.milestone ? (
                <>
                  <p className="text-sm font-bold">¡Hito desbloqueado! 🎉</p>
                  <p className="text-xs text-muted-foreground">{streakResult.streak} días de racha consecutiva</p>
                </>
              ) : streakResult.freeze_used ? (
                <>
                  <p className="text-sm font-bold">Racha protegida 🛡️</p>
                  <p className="text-xs text-muted-foreground">Se usó una protección. Racha: {streakResult.streak} días</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold">¡Racha actualizada!</p>
                  <p className="text-xs text-muted-foreground">{streakResult.streak} {streakResult.streak === 1 ? 'día' : 'días'} consecutivos 🔥</p>
                </>
              )}
            </div>
            <button onClick={() => setStreakResult(null)} className="text-muted-foreground hover:text-muted-foreground flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Session detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {format(parseISO(selected.scheduled_date), "EEEE d 'de' MMMM", { locale: es })} · {selected.duration_hours}hs
                  </p>
                  <h3 className="font-semibold text-foreground text-lg">{selected.title}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selected.description && (
                <div className="bg-muted rounded-xl p-4 mb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                </div>
              )}

              {/* Pomodoro */}
              <div className="mb-4">
                <PomodoroTimer />
              </div>

              {selected.topics && selected.topics.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">TEMAS A CUBRIR</p>
                  <ul className="space-y-1">
                    {selected.topics.map((topic, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: subjectColor }} />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!sessionState[selected.id] && (
                <>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Notas personales <span className="text-muted-foreground">(opcional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Ej: Me quedaron dudas sobre el tema X..."
                      rows={3}
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition resize-none"
                    />
                  </div>
                  <button
                    onClick={handleCompleteWithNotes}
                    disabled={completing === selected.id}
                    className="w-full flex items-center justify-center gap-2 rounded-xl text-white text-sm font-medium py-2.5 hover:opacity-90 disabled:opacity-60 transition"
                    style={{ backgroundColor: subjectColor }}
                  >
                    {completing === selected.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Marcar como completada
                  </button>
                </>
              )}

              {sessionState[selected.id] && (
                <div className="flex items-center gap-2 text-green-600 justify-center py-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Sesión completada</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
