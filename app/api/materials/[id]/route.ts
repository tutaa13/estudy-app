import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Get material to check ownership and storage path
  const { data: material } = await supabase
    .from('materials')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!material) return NextResponse.json({ error: 'Material no encontrado.' }, { status: 404 })

  // Delete file from storage if it exists
  if (material.storage_path) {
    await supabase.storage.from('materials').remove([material.storage_path])
  }

  // Delete from DB
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: 'Error al eliminar.' }, { status: 500 })

  return NextResponse.json({ success: true })
}
