'use client'

import { useState } from 'react'
import { Upload, Youtube, FileText, Image as ImageIcon, Loader2, Plus } from 'lucide-react'
import { MaterialType } from '@/types'

interface Props {
  subjectId: string
  onUploaded?: () => void
}

type Tab = MaterialType

export function MaterialUploader({ subjectId, onUploaded }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('pdf')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // PDF/Image state
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('')

  // Text state
  const [textTitle, setTextTitle] = useState('')
  const [textContent, setTextContent] = useState('')

  async function handleUpload() {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('subject_id', subjectId)
      formData.append('type', activeTab)

      if (activeTab === 'pdf' || activeTab === 'image') {
        if (!file) { setError('Seleccioná un archivo.'); setLoading(false); return }
        formData.append('file', file)
        formData.append('title', file.name.replace(/\.[^.]+$/, ''))
      } else if (activeTab === 'youtube') {
        if (!youtubeUrl) { setError('Ingresá la URL del video.'); setLoading(false); return }
        formData.append('url', youtubeUrl)
        formData.append('title', 'Video de YouTube')
      } else if (activeTab === 'text') {
        if (!textTitle || !textContent) { setError('Completá el título y el contenido.'); setLoading(false); return }
        formData.append('title', textTitle)
        formData.append('content', textContent)
      }

      const res = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al subir el material.')
      } else {
        setSuccess('Material subido y procesando. Puede tardar unos segundos.')
        setFile(null)
        setYoutubeUrl('')
        setTextTitle('')
        setTextContent('')
        onUploaded?.()
        // Refresh to show new material
        window.location.reload()
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'pdf', label: 'PDF', icon: <Upload className="w-4 h-4" /> },
    { key: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4" /> },
    { key: 'text', label: 'Texto', icon: <FileText className="w-4 h-4" /> },
    { key: 'image', label: 'Imagen', icon: <ImageIcon className="w-4 h-4" /> },
  ]

  return (
    <div className="border border-dashed border-gray-200 rounded-xl p-4 mb-5">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-50 rounded-xl p-1">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setError(''); setSuccess('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
              activeTab === key ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* PDF upload */}
      {(activeTab === 'pdf' || activeTab === 'image') && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
            dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
          }`}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            className="hidden"
            accept={activeTab === 'pdf' ? '.pdf' : 'image/*'}
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <p className="text-sm font-medium text-indigo-700">{file.name}</p>
          ) : (
            <>
              <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Arrastrá tu {activeTab === 'pdf' ? 'PDF' : 'imagen'} aquí o <span className="text-indigo-600 font-medium">hacé click</span>
              </p>
            </>
          )}
        </div>
      )}

      {/* YouTube */}
      {activeTab === 'youtube' && (
        <div className="space-y-3">
          <input
            type="url"
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
          />
          <p className="text-xs text-gray-400">La app descarga automáticamente la transcripción del video</p>
        </div>
      )}

      {/* Text */}
      {activeTab === 'text' && (
        <div className="space-y-3">
          <input
            type="text"
            value={textTitle}
            onChange={e => setTextTitle(e.target.value)}
            placeholder="Título del apunte"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
          />
          <textarea
            value={textContent}
            onChange={e => setTextContent(e.target.value)}
            placeholder="Escribí o pegá tus apuntes aquí..."
            rows={6}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition resize-none"
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-3">{error}</p>
      )}
      {success && (
        <p className="text-xs text-green-600 mt-3">{success}</p>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-indigo-700 disabled:opacity-60 transition w-full justify-center"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? 'Procesando...' : 'Agregar material'}
      </button>
    </div>
  )
}
