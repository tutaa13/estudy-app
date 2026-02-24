export type MaterialType = 'pdf' | 'youtube' | 'text' | 'image'
export type MaterialStatus = 'pending' | 'processing' | 'ready' | 'error'
export type QuestionType = 'multiple_choice' | 'short_answer' | 'true_false'
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export interface Profile {
  id: string
  full_name: string | null
  timezone: string
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  exam_date: string
  hours_per_day: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  subject_id: string
  user_id: string
  type: MaterialType
  title: string
  storage_path: string | null
  source_url: string | null
  raw_content: string | null
  processed_content: string | null
  status: MaterialStatus
  error_message: string | null
  file_size_bytes: number | null
  created_at: string
  updated_at: string
}

export interface StudyPlan {
  id: string
  subject_id: string
  user_id: string
  is_active: boolean
  generated_at: string
  total_days: number | null
  total_hours: number | null
}

export interface StudySession {
  id: string
  plan_id: string
  subject_id: string
  user_id: string
  scheduled_date: string
  duration_hours: number
  title: string
  description: string | null
  topics: string[]
  is_completed: boolean
  completed_at: string | null
  notes: string | null
  created_at: string
  // joined
  subject?: Subject
}

export interface Question {
  id: string
  subject_id: string
  material_id: string | null
  user_id: string
  type: QuestionType
  difficulty: QuestionDifficulty
  question_text: string
  options: Record<string, string> | null
  correct_answer: string
  explanation: string | null
  created_at: string
}

export interface QuestionAttempt {
  id: string
  question_id: string
  user_id: string
  user_answer: string
  is_correct: boolean
  attempted_at: string
}

// API payload types
export interface GeneratePlanPayload {
  subject_id: string
}

export interface GenerateQuestionsPayload {
  subject_id: string
  material_id?: string
  type: QuestionType
  difficulty: QuestionDifficulty
  count: number
}

export interface CompleteSessionPayload {
  notes?: string
}

// AI response types
export interface AIStudySession {
  date: string
  duration_hours: number
  title: string
  description: string
  topics: string[]
}

export interface AIStudyPlan {
  sessions: AIStudySession[]
}

export interface AIQuestion {
  type: QuestionType
  difficulty: QuestionDifficulty
  question_text: string
  options?: Record<string, string>
  correct_answer: string
  explanation: string
}
