import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acceso | RepairLab Enterprise',
  description: 'Inicia sesión para acceder al panel de gestión de RepairLab Enterprise.',
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * Auth group layout.
 * Full-screen centred layout with a dark gradient background and
 * a decorative radial spotlight so the login card feels premium.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className="
        relative min-h-screen overflow-hidden
        bg-[#0b0f1a]
        flex items-center justify-center
        px-4 py-12
      "
    >
      {/* Decorative background glows */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2
          h-[600px] w-[600px] rounded-full
          bg-indigo-600/20 blur-[120px]
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute bottom-0 right-0
          h-[400px] w-[400px] rounded-full
          bg-violet-700/15 blur-[100px]
        "
      />

      {/* Content */}
      <div className="relative z-10 w-full flex justify-center">
        {children}
      </div>
    </div>
  )
}
