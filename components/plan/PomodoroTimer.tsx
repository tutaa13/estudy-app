'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Timer, Settings2, X } from 'lucide-react'

const PRESETS = [
  { label: '25 / 5', work: 25, rest: 5 },
  { label: '45 / 10', work: 45, rest: 10 },
  { label: '50 / 10', work: 50, rest: 10 },
]

type Phase = 'work' | 'rest'

export function PomodoroTimer() {
  const [workMin, setWorkMin] = useState(25)
  const [restMin, setRestMin] = useState(5)
  const [phase, setPhase] = useState<Phase>('work')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [customWork, setCustomWork] = useState('25')
  const [customRest, setCustomRest] = useState('5')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = phase === 'work' ? workMin * 60 : restMin * 60
  const progress = secondsLeft / totalSeconds
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  const notify = useCallback((msg: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('EstudiApp · Pomodoro', { body: msg, icon: '/favicon.ico' })
    }
  }, [])

  const switchPhase = useCallback((next: Phase, wMin: number, rMin: number) => {
    setPhase(next)
    setSecondsLeft((next === 'work' ? wMin : rMin) * 60)
    setRunning(false)
    notify(next === 'work' ? '¡Descansaste! Hora de volver a estudiar.' : '¡Terminaste el bloque! Tomá un descanso.')
  }, [notify])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            const next: Phase = phase === 'work' ? 'rest' : 'work'
            switchPhase(next, workMin, restMin)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
  }, [running, phase, workMin, restMin, switchPhase])

  function applyPreset(work: number, rest: number) {
    setWorkMin(work)
    setRestMin(rest)
    setPhase('work')
    setSecondsLeft(work * 60)
    setRunning(false)
  }

  function applyCustom() {
    const w = Math.max(1, Math.min(120, parseInt(customWork) || 25))
    const r = Math.max(1, Math.min(60, parseInt(customRest) || 5))
    setWorkMin(w)
    setRestMin(r)
    setPhase('work')
    setSecondsLeft(w * 60)
    setRunning(false)
    setShowSettings(false)
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  function handleStart() {
    requestNotificationPermission()
    setRunning(true)
  }

  function reset() {
    setRunning(false)
    setPhase('work')
    setSecondsLeft(workMin * 60)
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const isWork = phase === 'work'

  return (
    <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Timer className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pomodoro</span>
        </div>
        <button
          onClick={() => setShowSettings(v => !v)}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          {showSettings ? <X className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
        </button>
      </div>

      {showSettings ? (
        <div className="space-y-3">
          {/* Presets */}
          <div className="flex gap-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => { applyPreset(p.work, p.rest); setCustomWork(String(p.work)); setCustomRest(String(p.rest)) }}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition font-medium ${
                  workMin === p.work && restMin === p.rest
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Custom */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Trabajo (min)</p>
              <input
                type="number"
                min={1} max={120}
                value={customWork}
                onChange={e => setCustomWork(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 text-center"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Descanso (min)</p>
              <input
                type="number"
                min={1} max={60}
                value={customRest}
                onChange={e => setCustomRest(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 text-center"
              />
            </div>
            <button
              onClick={applyCustom}
              className="mt-5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Circular progress */}
          <div className="relative flex-shrink-0">
            <svg width={88} height={88} className="-rotate-90">
              <circle
                cx={44} cy={44} r={radius}
                stroke="#e5e7eb" strokeWidth={6} fill="none"
              />
              <circle
                cx={44} cy={44} r={radius}
                stroke={isWork ? '#6366f1' : '#10b981'}
                strokeWidth={6} fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-gray-900 leading-none">{mins}:{secs}</span>
              <span className={`text-[10px] font-medium mt-0.5 ${isWork ? 'text-indigo-600' : 'text-emerald-600'}`}>
                {isWork ? 'Estudio' : 'Descanso'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 space-y-2">
            <p className="text-xs text-gray-400">
              {workMin} min trabajo · {restMin} min descanso
            </p>
            <div className="flex gap-2">
              <button
                onClick={running ? () => setRunning(false) : handleStart}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition ${
                  isWork ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {running ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-100 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
