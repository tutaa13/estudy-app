'use client'

import { StudySession, Subject } from '@/types'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

interface Props {
  sessions: StudySession[]
  subjects: Subject[]
}

export function GlobalCalendar({ sessions, subjects }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selected, setSelected] = useState<string | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  // Build a map of date → sessions
  const sessionsByDate: Record<string, StudySession[]> = {}
  for (const session of sessions) {
    const d = session.scheduled_date
    if (!sessionsByDate[d]) sessionsByDate[d] = []
    sessionsByDate[d].push(session)
  }

  const selectedSessions = selected ? sessionsByDate[selected] ?? [] : []

  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className="space-y-4">
      {/* Legend */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {subjects.map(s => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </div>
          ))}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-semibold text-foreground capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekdays.map(d => (
            <div key={d} className="text-xs text-center font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const daySessions = sessionsByDate[dateStr] ?? []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const today = isToday(day)
            const isSelected = selected === dateStr

            return (
              <div
                key={dateStr}
                onClick={() => daySessions.length > 0 && setSelected(isSelected ? null : dateStr)}
                className={`min-h-[52px] p-1 rounded-xl transition ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${
                  daySessions.length > 0 ? 'cursor-pointer hover:bg-muted' : ''
                } ${isSelected ? 'ring-2 ring-violet-400' : ''}`}
              >
                <div className={`text-xs font-medium text-center mb-1 w-6 h-6 flex items-center justify-center rounded-full mx-auto ${
                  today ? 'bg-violet-600 text-white' : 'text-muted-foreground'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {daySessions.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      className="h-1.5 rounded-full"
                      style={{ backgroundColor: session.subject?.color ?? '#6366f1', opacity: session.is_completed ? 0.5 : 1 }}
                    />
                  ))}
                  {daySessions.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">+{daySessions.length - 3}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && selectedSessions.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-3 capitalize">
            {format(parseISO(selected), "EEEE d 'de' MMMM", { locale: es })}
          </h3>
          <div className="space-y-2">
            {selectedSessions.map(session => (
              <div
                key={session.id}
                className={`flex items-start gap-3 p-3 rounded-xl border ${
                  session.is_completed ? 'border-green-100 bg-green-50' : 'border-border'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: session.subject?.color ?? '#6366f1' }}
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${session.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {session.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {session.subject?.name} · {session.duration_hours}hs
                  </p>
                </div>
                {session.is_completed && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="bg-card rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground text-sm">
            Generá planes de estudio para tus materias y aparecerán aquí en el calendario.
          </p>
        </div>
      )}
    </div>
  )
}
