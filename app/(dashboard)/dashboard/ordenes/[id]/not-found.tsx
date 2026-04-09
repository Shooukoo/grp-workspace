import Link from 'next/link'

/**
 * Rendered by notFound() when an order ID doesn't exist
 * or when RLS blocks the query for this user.
 */
export default function OrdenNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-4xl">
        🔍
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Orden no encontrada</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Esta orden no existe o no tienes acceso a ella. Verifica el enlace o
          regresa al listado de órdenes.
        </p>
      </div>
      <Link
        href="/dashboard/ordenes"
        className="
          inline-flex items-center gap-2 rounded-xl
          bg-gradient-to-r from-indigo-600 to-purple-600
          px-5 py-2.5 text-sm font-semibold text-white
          shadow-lg shadow-indigo-500/30
          transition-all duration-200
          hover:from-indigo-500 hover:to-purple-500
        "
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver a órdenes
      </Link>
    </div>
  )
}
