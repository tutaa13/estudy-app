'use client'

import { useState } from 'react'
import { Material } from '@/types'
import { FileText, Youtube, Image as ImageIcon, Upload, CheckCircle2, Clock, AlertCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const typeIcon: Record<string, React.ReactNode> = {
  pdf: <Upload className="w-4 h-4 text-red-500" />,
  youtube: <Youtube className="w-4 h-4 text-red-500" />,
  text: <FileText className="w-4 h-4 text-blue-500" />,
  image: <ImageIcon className="w-4 h-4 text-green-500" />,
}

const typeLabel: Record<string, string> = {
  pdf: 'PDF',
  youtube: 'YouTube',
  text: 'Texto',
  image: 'Imagen',
}

const statusIcon: Record<string, React.ReactNode> = {
  ready: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  processing: <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />,
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
}

interface Props {
  materials: Material[]
}

export function MaterialList({ materials }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este material?')) return
    setDeleting(id)
    await fetch(`/api/materials/${id}`, { method: 'DELETE' })
    window.location.reload()
  }

  return (
    <div className="space-y-2 mt-4">
      {materials.map((material) => (
        <div key={material.id} className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-3.5">
            <div className="flex-shrink-0">{typeIcon[material.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{material.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{typeLabel[material.type]}</span>
                {material.source_url && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <a
                      href={material.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-500 hover:underline truncate max-w-[150px]"
                    >
                      Ver video
                    </a>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {statusIcon[material.status]}
              {material.status === 'error' && (
                <span className="text-xs text-red-500">{material.error_message}</span>
              )}
              {material.raw_content && (
                <button
                  onClick={() => setExpanded(expanded === material.id ? null : material.id)}
                  className="text-muted-foreground hover:text-muted-foreground transition"
                >
                  {expanded === material.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={() => handleDelete(material.id)}
                disabled={deleting === material.id}
                className="text-muted-foreground hover:text-red-500 transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expanded content preview */}
          {expanded === material.id && material.raw_content && (
            <div className="border-t border-border p-3.5 bg-muted">
              <p className="text-xs font-medium text-muted-foreground mb-2">Contenido extraído (vista previa):</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-10">
                {material.raw_content.slice(0, 1500)}{material.raw_content.length > 1500 ? '...' : ''}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
