import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "d 'de' MMMM, yyyy", { locale: es })
}

export function formatDateShort(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy')
}

export function daysUntilExam(examDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = parseISO(examDate)
  return differenceInDays(exam, today)
}

export function getProgressColor(percentage: number) {
  if (percentage >= 80) return 'text-green-600'
  if (percentage >= 50) return 'text-yellow-600'
  return 'text-red-500'
}

export function truncate(text: string, maxTokens = 3000) {
  // Rough estimate: 1 token ≈ 4 chars
  const maxChars = maxTokens * 4
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '...'
}

export const SUBJECT_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#14b8a6', // teal
  '#22c55e', // green
  '#eab308', // yellow
  '#ef4444', // red
  '#3b82f6', // blue
  '#06b6d4', // cyan
]
