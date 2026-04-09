/**
 * Skeleton de carga para la página de Empleados.
 * Next.js lo muestra automáticamente mientras page.tsx hace el fetch a Supabase.
 */
export default function EmpleadosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-xl bg-white/5" />
          <div className="h-4 w-40 rounded-lg bg-white/5" />
        </div>
        {/* Button skeleton */}
        <div className="h-9 w-40 rounded-xl bg-white/5" />
      </div>

      {/* Table card skeleton */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 overflow-hidden">
        {/* Table header: Empleado | Rol | Fecha de Alta */}
        <div className="border-b border-white/5 bg-white/[0.02] px-5 py-3.5 flex gap-8">
          <div className="h-3 w-20 rounded bg-white/5" />
          <div className="h-3 w-10 rounded bg-white/5" />
          <div className="h-3 w-24 rounded bg-white/5" />
        </div>

        {/* Table rows */}
        <div className="divide-y divide-white/5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-3 flex-1">
                <div className="h-8 w-8 rounded-full bg-white/5 shrink-0" />
                <div className="h-4 w-40 rounded bg-white/5" />
              </div>
              {/* Role badge */}
              <div className="h-5 w-24 rounded-full bg-white/5" />
              {/* Date */}
              <div className="h-4 w-24 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>

      {/* Info callout skeleton */}
      <div className="h-12 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4" />
    </div>
  )
}
