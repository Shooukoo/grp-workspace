'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: '¿Puedo registrarme yo mismo?',
    a: 'No, RepairLab funciona por acceso controlado. Esto garantiza que cada cuenta reciba un onboarding personalizado y soporte desde el primer día. Contáctanos por WhatsApp y te configuramos en menos de 24 horas.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. Usamos Supabase con Row Level Security (RLS), lo que significa que cada taller solo puede ver sus propios datos. Nunca hay mezcla de información entre clientes.',
  },
  {
    q: '¿Funciona en celular?',
    a: 'El panel administrativo está optimizado para uso en desktop. Para los técnicos que trabajan en campo, tenemos una vista simplificada responsive que funciona en cualquier smartphone moderno.',
  },
  {
    q: '¿Puedo tener varias sucursales?',
    a: 'Sí, desde el plan Pro puedes gestionar hasta 3 sucursales con un solo panel. En el plan Enterprise las sucursales son ilimitadas.',
  },
  {
    q: '¿Cómo funcionan las notificaciones por WhatsApp?',
    a: 'Cada cambio de estado en una orden puede disparar un mensaje automático al número de WhatsApp del cliente. La integración se configura durante el onboarding.',
  },
]

function FAQItem({ q, a, index, inView }: { q: string; a: string; index: number; inView: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
      className="rounded-xl border border-white/5 bg-slate-900/40 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left gap-4 hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-sm font-medium text-slate-200">{q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQSection() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="faq" className="relative py-28">
      <div ref={ref} className="mx-auto max-w-2xl px-6 space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <span className="inline-block rounded-full border border-slate-700 bg-slate-800/60 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            FAQ
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Preguntas frecuentes
          </h2>
          <p className="text-sm text-slate-400">
            ¿Tienes más dudas? Escríbenos directamente por WhatsApp.
          </p>
        </motion.div>

        {/* Items */}
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}
