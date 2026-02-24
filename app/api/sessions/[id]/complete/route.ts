import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { notes, completed } = await req.json().catch(() => ({}))

  const update: Record<string, unknown> = {
    is_completed: completed !== false,
    completed_at: completed !== false ? new Date().toISOString() : null,
  }

  if (notes !== undefined) update.notes = notes

  const { error } = await supabase
    .from('study_sessions')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Error al actualizar.' }, { status: 500 })

  return NextResponse.json({ success: true })
}
