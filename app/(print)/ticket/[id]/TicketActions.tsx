'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'

export default function TicketActions({ orderId }: { orderId: string }) {
  const router = useRouter()

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

      {/* Botón imprimir */}
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
  )
}
