'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScanLine, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

type ScannerState = 'idle' | 'starting' | 'scanning' | 'success' | 'error'

const SCANNER_ELEMENT_ID = 'qr-scanner-viewport'

function extractOrderToken(raw: string): string | null {
  const text = raw.trim()
  const m1 = text.match(/\/seguimiento\/([a-zA-Z0-9_-]+)/)
  if (m1) return m1[1]
  const m2 = text.match(/\/dashboard\/ordenes\/([a-zA-Z0-9_-]+)/)
  if (m2) return m2[1]
  return null
}

export default function QRScanner() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ScannerState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null)

  /* Detener escáner */
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch { /* ya estaba detenido */ }
      scannerRef.current = null
    }
  }, [])

  /* Cerrar modal */
  const handleClose = useCallback(async () => {
    await stopScanner()
    setState('idle')
    setErrorMsg('')
    setOpen(false)
  }, [stopScanner])

  /* Cleanup al desmontar */
  useEffect(() => () => { stopScanner() }, [stopScanner])

  /* Iniciar escáner cuando el modal abre */
  useEffect(() => {
    if (!open) return

    let cancelled = false
    setState('starting')

    const init = async () => {
      // Importación dinámica — no afecta el bundle principal
      const { Html5Qrcode } = await import('html5-qrcode')

      if (cancelled) return

      setState('scanning')
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
      scannerRef.current = scanner

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          async (decodedText) => {
            const token = extractOrderToken(decodedText)
            if (!token) return

            await stopScanner()
            if (cancelled) return

            setState('success')

            setTimeout(() => {
              setOpen(false)
              setState('idle')
              // Siempre pasar como ?token= — el servidor resuelve si es ID o public_token
              router.push(`/dashboard/ordenes?token=${encodeURIComponent(token)}`)
            }, 900)
          },
          undefined // error de frame — ignorar, es normal
        )
      } catch (err: unknown) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        setErrorMsg(
          msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')
            ? 'Permiso de cámara denegado. Habilítalo en tu navegador.'
            : `No se pudo acceder a la cámara: ${msg}`
        )
        setState('error')
      }
    }

    init()
    return () => { cancelled = true }
  }, [open, router, stopScanner])

  return (
    <>
      {/* ── Botón trigger ─────────────────────────────────────────── */}
      <button
        id="qr-scanner-btn"
        onClick={() => setOpen(true)}
        className="
          inline-flex items-center gap-2 rounded-xl
          border border-indigo-500/30 bg-indigo-500/10
          px-4 py-2.5 text-sm font-medium text-indigo-300
          transition-all duration-200
          hover:bg-indigo-500/20 hover:text-indigo-200 hover:border-indigo-400/50
          active:scale-95
        "
      >
        <ScanLine size={16} />
        Escanear QR
      </button>

      {/* ── Modal ─────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <ScanLine size={18} className="text-indigo-400" />
                <span className="font-semibold text-white text-sm">Escanear QR de Ticket</span>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Viewport — html5-qrcode renderiza aquí */}
            <div className="relative bg-black overflow-hidden" style={{ minHeight: '300px' }}>

              {/* Contenedor que ocupa html5-qrcode */}
              <div id={SCANNER_ELEMENT_ID} className="w-full" />

              {/* Starting overlay */}
              {state === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 size={32} className="animate-spin text-indigo-400" />
                    <p className="text-sm">Iniciando cámara…</p>
                  </div>
                </div>
              )}

              {/* Success overlay */}
              {state === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/60 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 size={52} className="text-emerald-400" strokeWidth={1.5} />
                    <p className="text-white font-semibold text-sm">¡Orden encontrada!</p>
                  </div>
                </div>
              )}

              {/* Error overlay */}
              {state === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95">
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <AlertCircle size={36} className="text-red-400" />
                    <p className="text-slate-300 text-sm leading-snug">{errorMsg}</p>
                    <button
                      onClick={() => { setState('idle'); setOpen(false); setTimeout(() => setOpen(true), 100) }}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 text-center">
              <p className="text-xs text-slate-500">
                Apunta la cámara al código QR del ticket impreso
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
