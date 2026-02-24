'use client'

import { useState } from 'react'
import { StudySession } from '@/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, Circle, ChevronDown, X, Loader2 } from 'lucide-react'

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

    await fetch(`/api/sessions/${session.id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: newCompleted }),
    })

    setSessionState(prev => ({ ...prev, [session.id]: newCompleted }))
    setCompleting(null)
  }

  async function handleCompleteWithNotes() {
    if (!selected) return
    setCompleting(selected.id)

    await fetch(`/api/sessions/${selected.id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true, notes }),
    })

    setSessionState(prev => ({ ...prev, [selected.id]: true }))
    setNotes('')
    setSelected(null)
    setCompleting(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Sesiones de estudio ({sessions.length} días)</h2>
      </div>

      {/* Session list grouped by week */}
      <div className="space-y-6">
        {Object.entries(byWeek).map(([week, weekSessions]) => (
          <div key={week}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{week}</h3>
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
                        : 'border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30'
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
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-indigo-500" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {format(date, "EEEE d MMM", { locale: es })}
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400">{session.duration_hours}hs</span>
                      </div>
                      <p className={`text-sm font-medium mt-0.5 ${completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
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
                            <span className="text-xs text-gray-400 px-1 py-0.5">+{session.topics.length - 3} más</span>
                          )}
                        </div>
                      )}
                    </div>

                    <ChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Session detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    {format(parseISO(selected.scheduled_date), "EEEE d 'de' MMMM", { locale: es })} · {selected.duration_hours}hs
                  </p>
                  <h3 className="font-semibold text-gray-900 text-lg">{selected.title}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selected.description && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.description}</p>
                </div>
              )}

              {selected.topics && selected.topics.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">TEMAS A CUBRIR</p>
                  <ul className="space-y-1">
                    {selected.topics.map((topic, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
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
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Notas personales <span className="text-gray-400">(opcional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Ej: Me quedaron dudas sobre el tema X..."
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition resize-none"
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
