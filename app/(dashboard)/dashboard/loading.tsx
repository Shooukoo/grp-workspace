/**
 * Skeleton loading state for the Dashboard home.
 * Shown by Next.js automatically while page.tsx fetches data.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-xl bg-white/5" />
        <div className="h-4 w-80 rounded-lg bg-white/5" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 w-28 rounded bg-white/5" />
                <div className="h-10 w-16 rounded-lg bg-white/5" />
              </div>
              <div className="h-10 w-10 rounded-xl bg-white/5" />
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <div className="h-5 w-48 rounded-lg bg-white/5" />
        </div>
        <div className="divide-y divide-white/5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="h-4 w-20 rounded bg-white/5" />
              <div className="h-4 w-32 rounded bg-white/5" />
              <div className="h-4 w-28 rounded bg-white/5" />
              <div className="ml-auto h-5 w-20 rounded-full bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
