import Link from 'next/link'
import { ArrowLeft, SearchX } from 'lucide-react'

/**
 * Rendered by notFound() when an order ID doesn't exist
 * or when RLS blocks the query for this user.
 */
export default function OrdenNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center gap-8 px-4">

      {/* Icono */}
      <div className="relative">
        {/* Halo */}
        <div className="absolute inset-0 rounded-3xl bg-indigo-500/10 blur-2xl scale-150" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl
          bg-slate-800 border border-white/10 shadow-2xl shadow-black/40">
          <SearchX size={40} className="text-indigo-400" strokeWidth={1.5} />
        </div>
      </div>

      {/* Texto */}
      <div className="space-y-3 max-w-sm">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Orden no encontrada
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Esta orden no existe o no tienes acceso a ella.
          Verifica el enlace o regresa al listado de órdenes.
        </p>
      </div>

      {/* Botón */}
      <Link
        href="/dashboard/ordenes"
        className="
          inline-flex items-center gap-2 rounded-xl
          bg-gradient-to-r from-indigo-600 to-purple-600
          px-6 py-3 text-sm font-semibold text-white
          shadow-lg shadow-indigo-500/30
          transition-all duration-200
          hover:from-indigo-500 hover:to-purple-500
          hover:scale-[1.02] hover:shadow-indigo-500/50
          active:scale-95
        "
      >
        <ArrowLeft size={16} strokeWidth={2.5} />
        Volver a órdenes
      </Link>

    </div>
  )
}
