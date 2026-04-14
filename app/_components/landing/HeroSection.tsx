'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { MessageSquare, ArrowDown } from 'lucide-react'

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Hola%2C%20me%20interesa%20RepairLab%20Enterprise`

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

function FadeUp({ children, delay = 0, className = '' }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* ── Background glows ───────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -left-32 top-1/2 h-[400px] w-[400px] rounded-full bg-indigo-600/8 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-[350px] w-[350px] rounded-full bg-violet-700/8 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-4xl px-6 text-center space-y-8">
        {/* Badge */}
        <FadeUp delay={0}>
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              Plataforma SaaS Multi-Tenant · Acceso por invitación
            </span>
          </div>
        </FadeUp>

        {/* Heading */}
        <FadeUp delay={0.1}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            El sistema operativo{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              definitivo
            </span>{' '}
            para tu taller de reparación
          </h1>
        </FadeUp>

        {/* Subtitle */}
        <FadeUp delay={0.2}>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Controla tus órdenes, gestiona a tus técnicos y notifica a tus clientes por
            WhatsApp. Únete a la nueva era de la gestión técnica.
          </p>
        </FadeUp>

        {/* CTAs */}
        <FadeUp delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.03] hover:shadow-indigo-500/50 active:scale-95"
            >
              <MessageSquare size={16} />
              Agendar Demostración
            </a>
            <a
              href="#caracteristicas"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-95"
            >
              Explorar características
              <ArrowDown size={14} className="animate-bounce" />
            </a>
          </div>
        </FadeUp>

        {/* Social proof */}
        <FadeUp delay={0.4}>
          <p className="text-xs text-slate-600">
            Diseñado para talleres pequeños, medianos y cadenas multi-sucursal.
          </p>
        </FadeUp>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-slate-600">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <ArrowDown size={14} className="text-slate-600" />
        </motion.div>
      </div>
    </section>
  )
}
