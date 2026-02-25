'use client'

import { useState } from 'react'
import { Flame, Shield, Trophy, X, Zap } from 'lucide-react'

interface Props {
  currentStreak: number
  longestStreak: number
  lastStudyDate: string | null
  freezeCount: number
}

const MILESTONES = [3, 7, 14, 30, 50, 100, 365]

function getNextMilestone(streak: number) {
  return MILESTONES.find(m => m > streak) ?? null
}

function isAtRisk(lastStudyDate: string | null): boolean {
  if (!lastStudyDate) return false
  const today = new Date().toISOString().split('T')[0]
  if (lastStudyDate === today) return false
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return lastStudyDate === yesterday.toISOString().split('T')[0]
}

export function StreakCard({ currentStreak, longestStreak, lastStudyDate, freezeCount }: Props) {
  const [showMilestone, setShowMilestone] = useState(false)
  const atRisk = isAtRisk(lastStudyDate)
  const nextMilestone = getNextMilestone(currentStreak)
  const progressToNext = nextMilestone
    ? ((currentStreak - (MILESTONES[MILESTONES.indexOf(nextMilestone) - 1] ?? 0)) /
       (nextMilestone - (MILESTONES[MILESTONES.indexOf(nextMilestone) - 1] ?? 0))) * 100
    : 100

  const flameColor = currentStreak === 0
    ? 'text-gray-300'
    : atRisk
    ? 'text-orange-400'
    : 'text-orange-500'

  return (
    <>
      <div className={`bg-white rounded-2xl border p-5 transition ${
        atRisk ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl ${
              currentStreak > 0 ? 'bg-orange-50' : 'bg-gray-50'
            }`}>
              <Flame className={`w-6 h-6 ${flameColor} ${currentStreak > 0 ? 'drop-shadow-sm' : ''}`} />
              {currentStreak > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {currentStreak >= 100 ? '!' : ''}
                </span>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none">
                {currentStreak}
                <span className="text-sm font-medium text-gray-400 ml-1">
                  {currentStreak === 1 ? 'día' : 'días'}
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Racha de estudio</p>
            </div>
          </div>

          {/* Streak freeze badges */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.max(freezeCount, 0) }).map((_, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center" title="Protección de racha">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
              </div>
            ))}
            {freezeCount === 0 && (
              <span className="text-xs text-gray-400">Sin protecciones</span>
            )}
          </div>
        </div>

        {/* At risk warning */}
        {atRisk && currentStreak > 0 && (
          <div className="flex items-center gap-2 bg-orange-100 rounded-xl px-3 py-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
            <p className="text-xs font-medium text-orange-700">
              Tu racha está en peligro. ¡Estudiá hoy para mantenerla!
            </p>
          </div>
        )}

        {/* Zero streak CTA */}
        {currentStreak === 0 && (
          <p className="text-xs text-gray-500 mb-3">
            Completá una sesión hoy para iniciar tu racha 🔥
          </p>
        )}

        {/* Progress to next milestone */}
        {nextMilestone && currentStreak > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Próximo hito</span>
              <span className="text-xs font-semibold text-orange-600">{nextMilestone} días</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {nextMilestone - currentStreak} {nextMilestone - currentStreak === 1 ? 'día' : 'días'} para el hito
            </p>
          </div>
        )}

        {/* Longest streak */}
        {longestStreak > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-gray-500">Mejor racha</span>
            </div>
            <span className="text-xs font-semibold text-gray-700">{longestStreak} días</span>
          </div>
        )}
      </div>

      {/* Milestone modal */}
      {showMilestone && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 text-center max-w-xs w-full shadow-2xl">
            <div className="text-5xl mb-4">🔥</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Hito alcanzado!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Llegaste a <span className="font-bold text-orange-500">{currentStreak} días</span> de racha consecutiva. ¡Seguí así!
            </p>
            <button
              onClick={() => setShowMilestone(false)}
              className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition"
            >
              ¡A seguir estudiando!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
