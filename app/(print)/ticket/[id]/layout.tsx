/**
 * Layout mínimo para la ruta de impresión de ticket.
 * Solo renderiza {children} — sin sidebar, sin navbar, sin nada del dashboard.
 * El root layout (app/layout.tsx) ya provee <html> y <body>.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
