'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Loader2, User, Lock, CheckCircle2 } from 'lucide-react'

interface Props {
  profile: Profile
  email: string
}

export function SettingsForm({ profile, email }: Props) {
  const supabase = createClient()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (error) {
      setError('No se pudo guardar el perfil.')
    } else {
      setSuccess('Perfil actualizado correctamente.')
    }
    setLoading(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setError('No se pudo cambiar la contraseña.')
    } else {
      setSuccess('Contraseña actualizada.')
      setNewPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      {/* Profile */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4.5 h-4.5 w-[18px] h-[18px] text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Perfil</h2>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-violet-600 text-white text-sm font-medium px-5 py-2.5 hover:bg-violet-700 disabled:opacity-60 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar cambios
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-[18px] h-[18px] text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Cambiar contraseña</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gray-800 text-white text-sm font-medium px-5 py-2.5 hover:bg-gray-900 disabled:opacity-60 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Cambiar contraseña
          </button>
        </form>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4" />
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}
