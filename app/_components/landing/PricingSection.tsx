'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { CheckCircle2, MessageSquare, Zap } from 'lucide-react'

const WA_LINK = 'https://wa.me/5213531373007?text=Hola%2C%20me%20interesa%20RepairLab%20Enterprise'
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface Plan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  highlight: boolean
  badge?: string
}

const PLANS: Plan[] = [
  {
    name: 'Básico',
    price: '$499',
    period: '/mes',
    description: 'Ideal para talleres pequeños que inician su digitalización.',
    features: [
      '1 sucursal',
      'Hasta 3 técnicos',
      'Órdenes ilimitadas',
      'Directorio de clientes',
      'Soporte por email',
    ],
    cta: 'Elegir Básico',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$999',
    period: '/mes',
    description: 'Para talleres en crecimiento con múltiples técnicos y flujo alto.',
    features: [
      'Hasta 3 sucursales',
      'Hasta 15 técnicos',
      'Órdenes ilimitadas',
      'Notificaciones WhatsApp',
      'Reportes avanzados',
      'Soporte prioritario',
    ],
    cta: 'Elegir Pro',
    highlight: true,
    badge: 'Más popular',
  },
  {
    name: 'Enterprise',
    price: 'A medida',
    period: '',
    description: 'Para cadenas multi-sucursal con necesidades específicas e integración.',
    features: [
      'Sucursales ilimitadas',
      'Empleados ilimitados',
      'API Access',
      'Onboarding dedicado',
      'SLA garantizado',
      'Soporte 24/7',
    ],
    cta: 'Contactar a Ventas',
    highlight: false,
  },
]

export default function PricingSection() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="precios" className="relative py-28 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 bottom-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/6 blur-3xl" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-5xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-16 space-y-4"
        >
          <span className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-violet-400">
            Precios
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Planes transparentes,<br />sin sorpresas
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            Sin contratos anuales forzosos. Contáctanos y adaptamos el plan a las
            necesidades de tu taller.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
              transition={{ duration: 0.55, ease: EASE, delay: i * 0.12 }}
              className={`relative rounded-2xl p-7 flex flex-col gap-6 transition-all duration-300 ${
                plan.highlight
                  ? 'bg-gradient-to-b from-indigo-600/20 to-violet-600/10 border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 scale-[1.03]'
                  : 'bg-slate-900/50 border border-white/5 hover:border-white/10 hover:-translate-y-1'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                    <Zap size={11} />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <p className={`text-xs font-bold uppercase tracking-widest ${plan.highlight ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm text-slate-500">{plan.period}</span>}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{plan.description}</p>
              </div>

              <div className={`h-px w-full ${plan.highlight ? 'bg-indigo-500/30' : 'bg-white/5'}`} />

              <ul className="space-y-3 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 size={15} className={`shrink-0 mt-0.5 ${plan.highlight ? 'text-indigo-400' : 'text-slate-500'}`} />
                    {feat}
                  </li>
                ))}
              </ul>

              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.02] active:scale-95'
                    : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white active:scale-95'
                }`}
              >
                <MessageSquare size={14} />
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center text-xs text-slate-600 mt-10"
        >
          Precios en MXN + IVA. Acceso por invitación — contáctanos para comenzar.
        </motion.p>
      </div>
    </section>
  )
}
