import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Subject, Material, Question } from '@/types'
import { QuizGenerator } from '@/components/questions/QuizGenerator'

interface Props {
  params: { id: string }
}

export default async function QuestionsPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: subject }, { data: materials }, { data: recentQuestions }] = await Promise.all([
    supabase.from('subjects').select('*').eq('id', params.id).eq('user_id', user!.id).single(),
    supabase.from('materials').select('id, title, type').eq('subject_id', params.id).eq('status', 'ready'),
    supabase
      .from('questions')
      .select('*')
      .eq('subject_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!subject) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/subjects/${params.id}`} className="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preguntas de práctica</h1>
          <p className="text-sm text-gray-500">{(subject as Subject).name}</p>
        </div>
      </div>

      <QuizGenerator
        subjectId={params.id}
        subjectColor={(subject as Subject).color}
        materials={(materials as Material[]) ?? []}
        initialQuestions={(recentQuestions as Question[]) ?? []}
      />
    </div>
  )
}
