import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/types'
import { SettingsForm } from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
      <SettingsForm profile={profile as Profile} email={user!.email ?? ''} />
    </div>
  )
}
