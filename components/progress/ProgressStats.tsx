'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Subject } from '@/types'
import { Flame, CheckCircle2, Trophy, BookOpen } from 'lucide-react'

interface SubjectProgress {
  subject: Subject
  completed: number
  total: number
  pct: number
}

interface Props {
  subjectProgress: SubjectProgress[]
  weeklyHours: { date: string; hours: number }[]
  streak: number
  totalSessions: number
  quizScore: number
  totalAttempts: number
}

export function ProgressStats({
  subjectProgress,
  weeklyHours,
  streak,
  totalSessions,
  quizScore,
  totalAttempts,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          bg="bg-orange-50"
          value={`${streak} días`}
          label="Racha actual"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          bg="bg-green-50"
          value={totalSessions}
          label="Sesiones completadas"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
          bg="bg-yellow-50"
          value={`${quizScore}%`}
          label="Precisión en preguntas"
        />
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-indigo-500" />}
          bg="bg-indigo-50"
          value={totalAttempts}
          label="Preguntas respondidas"
        />
      </div>

      {/* Weekly chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Horas estudiadas esta semana</h2>
        {weeklyHours.every(d => d.hours === 0) ? (
          <p className="text-sm text-gray-400 text-center py-6">No hay sesiones completadas esta semana.</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyHours} barSize={28}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`${value}hs`, 'Horas']}
              />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                {weeklyHours.map((entry, index) => (
                  <Cell key={index} fill={entry.hours > 0 ? '#6366f1' : '#e2e8f0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Subject progress */}
      {subjectProgress.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Progreso por materia</h2>
          <div className="space-y-4">
            {subjectProgress.map(({ subject, completed, total, pct }) => (
              <div key={subject.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                    <span className="text-sm font-medium text-gray-900">{subject.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: subject.color }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: subject.color }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {total === 0
                    ? 'Sin plan generado'
                    : `${completed} de ${total} sesiones completadas`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {subjectProgress.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">No hay materias activas para mostrar progreso.</p>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  bg,
  value,
  label,
}: {
  icon: React.ReactNode
  bg: string
  value: string | number
  label: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${bg} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
