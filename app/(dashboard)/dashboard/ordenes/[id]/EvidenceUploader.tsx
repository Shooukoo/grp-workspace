'use client'

import { useRef, useState, useCallback } from 'react'
import { UploadCloud, X, CheckCircle2, AlertCircle, Loader2, ImageIcon } from 'lucide-react'
import { logEvidenceAction } from '@/app/actions/evidence'

interface FileState {
  file:       File
  preview:    string
  status:     'idle' | 'uploading' | 'done' | 'error'
  progress:   number
  publicUrl?: string
  error?:     string
}

interface EvidenceUploaderProps {
  orderId:    string
  workshopId: string
}

export default function EvidenceUploader({ orderId, workshopId }: EvidenceUploaderProps) {
  const inputRef                = useRef<HTMLInputElement>(null)
  const [files, setFiles]       = useState<FileState[]>([])
  const [isDragging, setDragging] = useState(false)
  const [globalMsg, setGlobalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  const updateFile = useCallback((index: number, patch: Partial<FileState>) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, ...patch } : f))
  }, [])

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return
    const next: FileState[] = Array.from(incoming)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({
        file:     f,
        preview:  URL.createObjectURL(f),
        status:   'idle',
        progress: 0,
      }))
    setFiles(prev => [...prev, ...next])
    setGlobalMsg(null)
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  /* ── Upload single file (server-proxy — avoids CORS) ───────────────────── */
  const uploadFile = useCallback(async (index: number, fileState: FileState): Promise<string | null> => {
    updateFile(index, { status: 'uploading', progress: 20 })

    // Build multipart form — the API route uploads to R2 server-side
    const body = new FormData()
    body.append('file',       fileState.file)
    body.append('workshopId', workshopId)
    body.append('orderId',    orderId)

    let res: Response
    try {
      res = await fetch('/api/upload', { method: 'POST', body })
    } catch {
      updateFile(index, { status: 'error', error: 'Error de red al subir.', progress: 0 })
      return null
    }

    updateFile(index, { progress: 80 })

    if (!res.ok) {
      const json = await res.json().catch(() => ({ error: 'Error al subir el archivo.' }))
      updateFile(index, { status: 'error', error: json.error ?? 'Error desconocido.', progress: 0 })
      return null
    }

    const { publicUrl } = await res.json()
    updateFile(index, { status: 'done', progress: 100, publicUrl })
    return publicUrl as string
  }, [workshopId, orderId, updateFile])

  /* ── Upload all & log ────────────────────────────────────────────────────── */
  const handleUploadAll = useCallback(async () => {
    const idleFiles = files
      .map((f, i) => ({ ...f, index: i }))
      .filter(f => f.status === 'idle')

    if (!idleFiles.length) return

    setGlobalMsg(null)

    const results = await Promise.all(
      idleFiles.map(f => uploadFile(f.index, f))
    )

    const uploaded = results.filter((u): u is string => u !== null)

    if (uploaded.length) {
      const result = await logEvidenceAction(orderId, uploaded)
      if (result.success) {
        setGlobalMsg({ type: 'success', text: `${uploaded.length} foto(s) registradas correctamente en la línea de tiempo.` })
      } else {
        setGlobalMsg({ type: 'error', text: result.error ?? 'Error al registrar la evidencia.' })
      }
    } else {
      setGlobalMsg({ type: 'error', text: 'No se pudo subir ningún archivo.' })
    }
  }, [files, uploadFile, orderId])

  /* ── Drag & Drop ─────────────────────────────────────────────────────────── */
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true)  }
  const onDragLeave = ()                   => setDragging(false)
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const hasIdle     = files.some(f => f.status === 'idle')
  const hasUploading = files.some(f => f.status === 'uploading')

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f111a]/90 backdrop-blur-xl shadow-xl overflow-hidden">
      {/* Gradient accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

      <div className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ImageIcon size={16} className="text-violet-400" />
            Evidencia Fotográfica
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Sube fotos del equipo al recibirlo.
          </p>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-2
            rounded-xl border-2 border-dashed cursor-pointer
            transition-all duration-200 px-4 py-8
            ${isDragging
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-white/10 bg-white/[0.02] hover:border-violet-500/50 hover:bg-violet-500/5'
            }
          `}
        >
          <UploadCloud size={28} className={isDragging ? 'text-violet-400' : 'text-white/30'} />
          <p className="text-sm text-white/50 text-center">
            <span className="text-violet-400 font-medium">Haz clic</span> o arrastra imágenes aquí
          </p>
          <p className="text-xs text-white/25">JPG, PNG, WEBP hasta 10 MB c/u</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => addFiles(e.target.files)}
          />
        </div>

        {/* File previews */}
        {files.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {files.map((f, i) => (
              <div
                key={i}
                className="relative rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] aspect-square"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.preview}
                  alt={f.file.name}
                  className="w-full h-full object-cover"
                />

                {/* Overlay for status */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                  {f.status === 'uploading' && (
                    <>
                      <Loader2 size={20} className="text-white animate-spin" />
                      {/* Progress bar */}
                      <div className="w-3/4 h-1 rounded-full bg-white/20 overflow-hidden mt-1">
                        <div
                          className="h-full bg-violet-400 rounded-full transition-all duration-300"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    </>
                  )}
                  {f.status === 'done' && (
                    <CheckCircle2 size={22} className="text-emerald-400 drop-shadow" />
                  )}
                  {f.status === 'error' && (
                    <>
                      <AlertCircle size={20} className="text-red-400" />
                      <p className="text-[10px] text-red-300 text-center px-2 leading-tight">{f.error}</p>
                    </>
                  )}
                </div>

                {/* Remove button (only when idle or error) */}
                {(f.status === 'idle' || f.status === 'error') && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeFile(i) }}
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-0.5 text-white/70 hover:text-white hover:bg-black/80 transition-colors"
                    aria-label="Quitar imagen"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {hasIdle && (
          <button
            type="button"
            onClick={handleUploadAll}
            disabled={hasUploading}
            className="
              w-full rounded-xl
              bg-gradient-to-r from-violet-600 to-fuchsia-600
              px-4 py-3 text-sm font-semibold text-white
              shadow-lg shadow-violet-500/25
              transition-all duration-200
              hover:from-violet-500 hover:to-fuchsia-500 hover:scale-[1.02]
              active:scale-95
              disabled:cursor-not-allowed disabled:opacity-60
              flex items-center justify-center gap-2
            "
          >
            {hasUploading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Subiendo…
              </>
            ) : (
              <>
                <UploadCloud size={15} />
                Subir {files.filter(f => f.status === 'idle').length} foto(s)
              </>
            )}
          </button>
        )}

        {/* Global feedback */}
        {globalMsg && (
          <div
            role={globalMsg.type === 'error' ? 'alert' : 'status'}
            className={`
              flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm
              ${globalMsg.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/20 bg-red-500/10 text-red-300'
              }
            `}
          >
            {globalMsg.type === 'success'
              ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              : <AlertCircle  size={15} className="mt-0.5 shrink-0" />
            }
            {globalMsg.text}
          </div>
        )}
      </div>
    </div>
  )
}
