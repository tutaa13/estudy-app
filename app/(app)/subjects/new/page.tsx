import { SubjectForm } from '@/components/subjects/SubjectForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewSubjectPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/subjects" className="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nueva materia</h1>
      </div>
      <SubjectForm />
    </div>
  )
}
