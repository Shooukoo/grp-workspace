'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Download, Loader2 } from 'lucide-react'

export default function TicketActions({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      // Importación dinámica para no incluir html2canvas en el bundle principal
      const html2canvas = (await import('html2canvas')).default

      // Capturar SOLO el primer .ticket (parte cliente, antes del corte)
      const ticketEl = document.querySelector<HTMLElement>('.ticket')
      if (!ticketEl) return

      const canvas = await html2canvas(ticketEl, {
        scale: 3,          // Alta resolución
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      // Descargar como PNG
      const link = document.createElement('a')
      link.download = `ticket-${orderId.slice(-6).toUpperCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Error al descargar ticket:', err)
    } finally {
      setDownloading(false)
    }
  }, [orderId])

  return (
    <div className="no-print fixed top-4 left-4 right-4 z-50 flex items-center justify-between gap-3">
      {/* Botón volver */}
      <button
        onClick={() => router.push(`/dashboard/ordenes/${orderId}`)}
        className="flex items-center gap-1.5 rounded-full border border-white/10
          bg-slate-900/80 backdrop-blur px-4 py-2 text-sm font-medium text-slate-300
          hover:bg-slate-800 hover:text-white transition-all duration-200 shadow-lg"
      >
        <ArrowLeft size={14} />
        Volver a la orden
      </button>

      {/* Botones derecha */}
      <div className="flex items-center gap-2">
        {/* Descargar PNG */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 rounded-full border border-white/10
            bg-slate-900/80 backdrop-blur px-4 py-2 text-sm font-medium text-slate-300
            hover:bg-slate-800 hover:text-white transition-all duration-200 shadow-lg
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloading
            ? <Loader2 size={14} className="animate-spin" />
            : <Download size={14} />}
          {downloading ? 'Descargando…' : 'Descargar'}
        </button>

        {/* Imprimir */}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-full
            bg-indigo-600 px-5 py-2 text-sm font-semibold text-white
            shadow-xl shadow-indigo-500/30 hover:bg-indigo-500
            active:scale-95 transition-all duration-200"
        >
          <Printer size={14} />
          Imprimir
        </button>
      </div>
    </div>
  )
}
