'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { CheckCircle2, MessageSquare, Zap, Gift } from 'lucide-react'

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Hola%2C%20me%20interesa%20RepairLab%20Enterprise`
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface Plan {
  name: string
  monthlyPrice: string
  annualPrice: string
  annualOriginal?: string
  annualSavings?: string
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
    monthlyPrice: '$299',
    annualPrice: '$2,999',
    annualOriginal: '$3,588',
    annualSavings: '¡2 meses gratis!',
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
    monthlyPrice: '$699',
    annualPrice: '$6,999',
    annualOriginal: '$8,399',
    annualSavings: '¡2 meses gratis!',
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
    monthlyPrice: 'A medida',
    annualPrice: 'A medida',
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
  const ref      = useRef<HTMLDivElement>(null)
  const inView   = useInView(ref, { once: true, margin: '-80px' })
  const [annual, setAnnual] = useState(false)

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
          className="text-center mb-10 space-y-4"
        >
          <span className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-violet-400">
            Precios
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Planes transparentes,<br />sin sorpresas
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            Sin contratos forzosos. Contáctanos y adaptamos el plan a las
            necesidades de tu taller.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className={`text-sm font-semibold transition-colors ${!annual ? 'text-white' : 'text-slate-500'}`}>
            Mensual
          </span>
          <button
            onClick={() => setAnnual(prev => !prev)}
            aria-label="Cambiar ciclo de facturación"
            className={`relative h-7 w-14 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              annual ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                annual ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${annual ? 'text-white' : 'text-slate-500'}`}>
            Anual
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-400">
              <Gift size={10} />
              2 meses gratis
            </span>
          </span>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {PLANS.map((plan, i) => {
            const isCustom = plan.monthlyPrice === 'A medida'
            const displayPrice = annual && !isCustom ? plan.annualPrice : plan.monthlyPrice
            const displayPeriod = isCustom ? '' : annual ? '/año' : plan.period

            return (
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
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={displayPrice}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="text-4xl font-extrabold text-white"
                      >
                        {displayPrice}
                      </motion.span>
                    </AnimatePresence>
                    {displayPeriod && (
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={displayPeriod}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm text-slate-500"
                        >
                          {displayPeriod}
                        </motion.span>
                      </AnimatePresence>
                    )}
                  </div>

                  {/* Annual original price + savings */}
                  <AnimatePresence>
                    {annual && plan.annualOriginal && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-2 overflow-hidden"
                      >
                        <span className="text-xs text-slate-600 line-through">{plan.annualOriginal}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-xs font-bold text-emerald-400">
                          <Gift size={9} />
                          {plan.annualSavings}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
            )
          })}
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
