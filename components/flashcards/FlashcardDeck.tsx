'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, XCircle, Layers } from 'lucide-react'

interface Flashcard {
  front: string
  back: string
  options: Record<string, string>
  correct: string
}

interface Props {
  flashcards: Flashcard[]
  subjectColor: string
}

type Mode = 'flip' | 'quiz'

export function FlashcardDeck({ flashcards, subjectColor }: Props) {
  const [mode, setMode] = useState<Mode>('flip')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const [finished, setFinished] = useState(false)

  const card = flashcards[index]
  const total = flashcards.length

  function next() {
    if (index + 1 >= total) {
      setFinished(true)
      return
    }
    setIndex(i => i + 1)
    setFlipped(false)
    setSelected(null)
  }

  function prev() {
    if (index === 0) return
    setIndex(i => i - 1)
    setFlipped(false)
    setSelected(null)
  }

  function handleQuizSelect(letter: string) {
    if (selected) return
    setSelected(letter)
    if (letter === card.correct) {
      setScore(s => ({ ...s, correct: s.correct + 1 }))
    } else {
      setScore(s => ({ ...s, wrong: s.wrong + 1 }))
    }
  }

  function restart() {
    setIndex(0)
    setFlipped(false)
    setSelected(null)
    setScore({ correct: 0, wrong: 0 })
    setFinished(false)
  }

  function changeMode(m: Mode) {
    setMode(m)
    restart()
  }

  if (finished) {
    const pct = Math.round((score.correct / total) * 100)
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: subjectColor }}
        >
          {pct}%
        </div>
        <h3 className="text-lg font-bold text-foreground">¡Ronda terminada!</h3>
        {mode === 'quiz' && (
          <p className="text-sm text-muted-foreground">
            {score.correct} correctas · {score.wrong} incorrectas de {total}
          </p>
        )}
        <button
          onClick={restart}
          className="flex items-center gap-2 rounded-xl text-white text-sm font-medium px-5 py-2.5 transition hover:opacity-90"
          style={{ backgroundColor: subjectColor }}
        >
          <RotateCcw className="w-4 h-4" />
          Volver a empezar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {(['flip', 'quiz'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
              mode === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-muted-foreground'
            }`}
          >
            {m === 'flip' ? 'Tarjeta' : 'Quiz'}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%`, backgroundColor: subjectColor }}
          />
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">{index + 1} / {total}</span>
      </div>

      {/* FLIP MODE */}
      {mode === 'flip' && (
        <div>
          <div
            onClick={() => setFlipped(f => !f)}
            className="relative cursor-pointer select-none"
            style={{ perspective: '1000px', height: 220 }}
          >
            <div
              className="absolute inset-0 transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 rounded-2xl border border-border bg-card flex flex-col items-center justify-center p-6 text-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <Layers className="w-5 h-5 text-muted-foreground mb-3" />
                <p className="text-base font-semibold text-foreground">{card.front}</p>
                <p className="text-xs text-muted-foreground mt-4">Tocá para ver la respuesta</p>
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 text-center"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundColor: subjectColor }}
              >
                <p className="text-base font-semibold text-white leading-relaxed">{card.back}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={prev}
              disabled={index === 0}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1 text-sm font-medium transition"
              style={{ color: subjectColor }}
            >
              {index + 1 === total ? 'Terminar' : 'Siguiente'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* QUIZ MODE */}
      {mode === 'quiz' && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-base font-semibold text-foreground text-center">{card.front}</p>
          </div>

          <div className="space-y-2">
            {Object.entries(card.options).map(([letter, text]) => {
              let style = 'border-border bg-card text-foreground hover:border-gray-300'
              if (selected) {
                if (letter === card.correct) {
                  style = 'border-green-400 bg-green-50 text-green-800'
                } else if (letter === selected && selected !== card.correct) {
                  style = 'border-red-300 bg-red-50 text-red-800'
                } else {
                  style = 'border-border bg-card text-muted-foreground opacity-60'
                }
              }
              return (
                <button
                  key={letter}
                  onClick={() => handleQuizSelect(letter)}
                  disabled={!!selected}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left text-sm transition ${style}`}
                >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase">
                    {letter}
                  </span>
                  <span className="flex-1">{text}</span>
                  {selected && letter === card.correct && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  {selected && letter === selected && letter !== card.correct && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                </button>
              )
            })}
          </div>

          {selected && (
            <div className="space-y-2">
              <div className={`rounded-xl p-3 text-sm ${selected === card.correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {selected === card.correct ? '¡Correcto!' : `La respuesta correcta es: ${card.options[card.correct]}`}
              </div>
              <div className="bg-muted rounded-xl p-3 text-sm text-muted-foreground">
                <span className="font-medium text-muted-foreground">Explicación: </span>{card.back}
              </div>
              <button
                onClick={next}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90"
                style={{ backgroundColor: subjectColor }}
              >
                {index + 1 === total ? 'Ver resultados' : 'Siguiente →'}
              </button>
            </div>
          )}

          {/* Quiz score */}
          {(score.correct > 0 || score.wrong > 0) && (
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> {score.correct} correctas</span>
              <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3.5 h-3.5" /> {score.wrong} incorrectas</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
