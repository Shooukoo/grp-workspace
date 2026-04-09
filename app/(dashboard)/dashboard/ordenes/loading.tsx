/**
 * Skeleton de carga para la página de Órdenes.
 * Next.js lo muestra automáticamente mientras page.tsx hace el fetch a Supabase.
 */
export default function OrdenesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-xl bg-white/5" />
          <div className="h-4 w-48 rounded-lg bg-white/5" />
        </div>
        {/* Button skeleton */}
        <div className="h-9 w-40 rounded-xl bg-white/5" />
      </div>

      {/* Table card skeleton */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 overflow-hidden">
        {/* Table header */}
        <div className="border-b border-white/5 bg-white/[0.02] px-5 py-3.5 flex gap-6">
          <div className="h-3 w-16 rounded bg-white/5" />
          <div className="h-3 w-28 rounded bg-white/5" />
          <div className="h-3 w-20 rounded bg-white/5" />
          <div className="h-3 w-20 rounded bg-white/5 ml-auto" />
          <div className="h-3 w-16 rounded bg-white/5" />
        </div>

        {/* Table rows */}
        <div className="divide-y divide-white/5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-6">
              {/* ID badge */}
              <div className="h-5 w-14 rounded-full bg-white/5 shrink-0" />
              {/* Customer */}
              <div className="flex items-center gap-3 flex-1">
                <div className="h-7 w-7 rounded-full bg-white/5 shrink-0" />
                <div className="h-4 w-36 rounded bg-white/5" />
              </div>
              {/* Device */}
              <div className="h-4 w-28 rounded bg-white/5" />
              {/* Date */}
              <div className="h-4 w-20 rounded bg-white/5 ml-auto" />
              {/* Status badge */}
              <div className="h-5 w-20 rounded-full bg-white/5 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
