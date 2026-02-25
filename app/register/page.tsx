'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Ya existe una cuenta con ese email.'
        : 'Ocurrió un error. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setEmailSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 mb-4">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">EstudiApp</h1>
          <p className="text-sm text-muted-foreground mt-1">Creá tu cuenta gratis</p>
        </div>

        {emailSent ? (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">¡Revisá tu email!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Te enviamos un link de confirmación a <span className="font-medium text-muted-foreground">{email}</span>.
              Hacé click en el link para activar tu cuenta.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-violet-600 text-white font-medium py-2.5 px-6 text-sm hover:bg-violet-700 transition"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        ) : (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition"
                placeholder="Juan García"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white font-medium py-2.5 text-sm hover:bg-violet-700 disabled:opacity-60 transition"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear cuenta
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-violet-600 font-medium hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>
        )}
      </div>
    </div>
  )
}
