'use client'

import { useState } from 'react'
import { Material, Question, QuestionDifficulty, QuestionType } from '@/types'
import { Sparkles, Loader2, CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react'

interface Props {
  subjectId: string
  subjectColor: string
  materials: Material[]
  initialQuestions: Question[]
}

type Mode = 'config' | 'quiz' | 'results'

export function QuizGenerator({ subjectId, subjectColor, materials, initialQuestions }: Props) {
  const [mode, setMode] = useState<Mode>('config')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Config state
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice')
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium')
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          material_id: selectedMaterial || undefined,
          type: questionType,
          difficulty,
          count,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al generar preguntas.')
      } else {
        setQuestions(data.questions)
        setCurrentIndex(0)
        setAnswers({})
        setMode('quiz')
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function handleAnswer(questionId: string, answer: string) {
    if (answers[questionId]) return // Already answered
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setMode('results')
    }
  }

  const currentQuestion = questions[currentIndex]
  const correctCount = questions.filter(q => answers[q.id] === q.correct_answer).length
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

  if (mode === 'quiz' && currentQuestion) {
    const answered = !!answers[currentQuestion.id]

    return (
      <div className="space-y-4">
        {/* Progress */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Pregunta {currentIndex + 1} de {questions.length}</span>
          <button onClick={() => setMode('config')} className="text-xs text-muted-foreground hover:text-muted-foreground">
            Salir
          </button>
        </div>
        <div className="h-1.5 bg-muted rounded-full">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, backgroundColor: subjectColor }}
          />
        </div>

        {/* Question card */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-600' :
              'bg-red-50 text-red-600'
            }`}>
              {currentQuestion.difficulty === 'easy' ? 'Fácil' : currentQuestion.difficulty === 'medium' ? 'Media' : 'Difícil'}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentQuestion.type === 'multiple_choice' ? 'Opción múltiple' : currentQuestion.type === 'short_answer' ? 'Respuesta corta' : 'Verdadero/Falso'}
            </span>
          </div>

          <p className="text-base font-medium text-foreground mb-6">{currentQuestion.question_text}</p>

          {/* Multiple choice / True-False options */}
          {currentQuestion.options && (
            <div className="space-y-2.5">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                const isSelected = answers[currentQuestion.id] === key
                const isCorrectOption = key === currentQuestion.correct_answer
                let optionClass = 'border-border hover:border-violet-300 hover:bg-violet-50/30 cursor-pointer'

                if (answered) {
                  if (isCorrectOption) optionClass = 'border-green-400 bg-green-50'
                  else if (isSelected) optionClass = 'border-red-400 bg-red-50'
                  else optionClass = 'border-border opacity-60'
                }

                return (
                  <div
                    key={key}
                    onClick={() => handleAnswer(currentQuestion.id, key)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition ${answered ? 'cursor-default' : 'cursor-pointer'} ${optionClass}`}
                  >
                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {key.toUpperCase()}
                    </span>
                    <span className="text-sm">{value}</span>
                    {answered && isCorrectOption && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                    {answered && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
                  </div>
                )
              })}
            </div>
          )}

          {/* Short answer */}
          {!currentQuestion.options && (
            <div>
              {!answered ? (
                <div className="space-y-3">
                  <textarea
                    placeholder="Escribí tu respuesta..."
                    rows={3}
                    id={`answer-${currentQuestion.id}`}
                    className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition resize-none"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById(`answer-${currentQuestion.id}`) as HTMLTextAreaElement
                      handleAnswer(currentQuestion.id, el.value)
                    }}
                    className="rounded-xl text-white text-sm font-medium px-5 py-2.5 hover:opacity-90 transition"
                    style={{ backgroundColor: subjectColor }}
                  >
                    Responder
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Tu respuesta:</p>
                    <p className="text-sm text-muted-foreground">{answers[currentQuestion.id]}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-green-700 mb-1">Respuesta correcta:</p>
                    <p className="text-sm text-green-800">{currentQuestion.correct_answer}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          {answered && currentQuestion.explanation && (
            <div className="mt-4 p-3.5 bg-blue-50 rounded-xl">
              <p className="text-xs font-semibold text-blue-700 mb-1">Explicación:</p>
              <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Next button */}
          {answered && (
            <button
              onClick={handleNext}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl text-white text-sm font-medium py-2.5 hover:opacity-90 transition"
              style={{ backgroundColor: subjectColor }}
            >
              {currentIndex < questions.length - 1 ? 'Siguiente pregunta' : 'Ver resultados'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  if (mode === 'results') {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center space-y-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-white"
          style={{ backgroundColor: score >= 60 ? '#22c55e' : '#ef4444' }}
        >
          {score}%
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">
            {score >= 80 ? '¡Excelente!' : score >= 60 ? '¡Bien!' : 'Hay que repasar'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Acertaste {correctCount} de {questions.length} preguntas
          </p>
        </div>

        {/* Per-question summary */}
        <div className="text-left space-y-2 mt-4">
          {questions.map((q) => {
            const correct = answers[q.id] === q.correct_answer
            return (
              <div key={q.id} className={`flex items-start gap-2 p-3 rounded-xl ${correct ? 'bg-green-50' : 'bg-red-50'}`}>
                {correct ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                <p className="text-sm text-muted-foreground">{q.question_text}</p>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => { setMode('config'); setQuestions([]); setAnswers({}) }}
          className="flex items-center gap-2 mx-auto rounded-xl text-white text-sm font-medium px-5 py-2.5 hover:opacity-90 transition"
          style={{ backgroundColor: subjectColor }}
        >
          <RotateCcw className="w-4 h-4" />
          Practicar de nuevo
        </button>
      </div>
    )
  }

  // Config mode
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${subjectColor}20` }}>
          <Sparkles className="w-5 h-5" style={{ color: subjectColor }} />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Generador de preguntas</h2>
          <p className="text-sm text-muted-foreground">La IA crea preguntas basadas en tus materiales</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Material filter */}
        {materials.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Material específico <span className="text-muted-foreground">(opcional)</span>
            </label>
            <select
              value={selectedMaterial}
              onChange={e => setSelectedMaterial(e.target.value)}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-violet-500 transition"
            >
              <option value="">Todos los materiales</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Tipo de preguntas</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'multiple_choice', label: 'Opción múltiple' },
              { value: 'true_false', label: 'Verdadero/Falso' },
              { value: 'short_answer', label: 'Resp. corta' },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setQuestionType(value as QuestionType)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                  questionType === value
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-border text-muted-foreground hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Dificultad</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'easy', label: 'Fácil', color: 'text-green-700 border-green-300 bg-green-50' },
              { value: 'medium', label: 'Media', color: 'text-yellow-700 border-yellow-300 bg-yellow-50' },
              { value: 'hard', label: 'Difícil', color: 'text-red-700 border-red-300 bg-red-50' },
            ].map(({ value, label, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDifficulty(value as QuestionDifficulty)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                  difficulty === value ? color : 'border-border text-muted-foreground hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Cantidad de preguntas: <span className="text-violet-600 font-bold">{count}</span>
          </label>
          <input
            type="range"
            min={3}
            max={15}
            step={1}
            value={count}
            onChange={e => setCount(parseInt(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>3</span>
            <span>15</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl text-white text-sm font-medium py-2.5 hover:opacity-90 disabled:opacity-60 transition"
          style={{ backgroundColor: subjectColor }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generando preguntas...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generar {count} preguntas</>
          )}
        </button>
      </div>

      {/* Recent questions count */}
      {initialQuestions.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Tenés {initialQuestions.length} preguntas generadas anteriormente para esta materia
        </p>
      )}
    </div>
  )
}
