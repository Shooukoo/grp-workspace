import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Core | RepairLab',
  robots: { index: false, follow: false }, // never index this panel
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* ── Top navbar ─────────────────────────────────────────────────── */}
      <header className="h-12 flex items-center gap-3 px-6 border-b border-white/8 shrink-0 select-none">
        {/* Red dot — visual cue that this is a privileged zone */}
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[11px] font-mono font-semibold tracking-widest text-red-400 uppercase">
          Admin Core
        </span>
        <span className="ml-auto text-[10px] text-white/20 font-mono">
          RepairLab Superadmin
        </span>
      </header>

      {/* ── Page content ───────────────────────────────────────────────── */}
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
