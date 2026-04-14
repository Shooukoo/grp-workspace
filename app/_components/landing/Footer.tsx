import Link from 'next/link'
import { Zap } from 'lucide-react'

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Hola%2C%20me%20interesa%20RepairLab%20Enterprise`

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-slate-900/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Zap size={13} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-tight">RepairLab</p>
                <p className="text-[10px] text-slate-600">Enterprise</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[220px]">
              El sistema operativo definitivo para talleres de reparación electrónica.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Producto</p>
            <ul className="space-y-2">
              {[
                { href: '#caracteristicas', label: 'Características' },
                { href: '#precios',         label: 'Precios'          },
                { href: '#faq',             label: 'FAQ'              },
                { href: WA_LINK,            label: 'Solicitar acceso', external: true },
              ].map(({ href, label, external }) => (
                <li key={label}>
                  {external ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                      {label}
                    </a>
                  ) : (
                    <a href={href} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                      {label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Legal</p>
            <ul className="space-y-2">
              {['Términos de Servicio', 'Política de Privacidad', 'Cookies'].map((item) => (
                <li key={item}>
                  <span className="text-xs text-slate-600 cursor-not-allowed" title="Próximamente">
                    {item}
                  </span>
                </li>
              ))}
              <li>
                <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Área de clientes →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <p>© {year} RepairLab Enterprise. Todos los derechos reservados.</p>
          <p>Hecho con código y café ☕ en México</p>
        </div>
      </div>
    </footer>
  )
}
