'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Building2, ClipboardList, Users, MessageSquare } from 'lucide-react'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const FEATURES = [
  {
    icon: Building2,
    title: 'Gestión Multi-Taller',
    description:
      'Administra diferentes sucursales con roles separados. Cada técnico ve únicamente lo que le corresponde.',
    gradient: 'from-indigo-500 to-blue-600',
    borderSelected: 'border-indigo-500/60',
    glow: 'shadow-indigo-500/20',
    glowSelected: 'shadow-indigo-500/40',
  },
  {
    icon: ClipboardList,
    title: 'Control de Órdenes',
    description:
      'Visualiza el estado de todas las reparaciones en tiempo real y actualiza el flujo de trabajo con un solo clic.',
    gradient: 'from-violet-500 to-purple-600',
    borderSelected: 'border-violet-500/60',
    glow: 'shadow-violet-500/20',
    glowSelected: 'shadow-violet-500/40',
  },
  {
    icon: Users,
    title: 'Directorio de Clientes',
    description:
      'Historial completo de reparaciones por cliente, comunicación directa por WhatsApp y acceso instantáneo.',
    gradient: 'from-purple-500 to-pink-600',
    borderSelected: 'border-purple-500/60',
    glow: 'shadow-purple-500/20',
    glowSelected: 'shadow-purple-500/40',
  },
  {
    icon: MessageSquare,
    title: 'Notificaciones Inteligentes',
    description:
      'Avisos automáticos por WhatsApp al cliente cuando su equipo cambia de estado. Cero llamadas innecesarias.',
    gradient: 'from-emerald-500 to-teal-600',
    borderSelected: 'border-emerald-500/60',
    glow: 'shadow-emerald-500/20',
    glowSelected: 'shadow-emerald-500/40',
  },
]

export default function FeaturesSection() {
  const ref      = useRef<HTMLDivElement>(null)
  const inView   = useInView(ref, { once: true, margin: '-80px' })
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <section id="caracteristicas" className="relative py-28 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/5 blur-3xl" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-16 space-y-4"
        >
          <span className="inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Funcionalidades
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Todo lo que necesita tu taller,<br />en un solo lugar
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            RepairLab centraliza cada aspecto de la operación técnica para que puedas
            enfocarte en lo que importa: reparar y fidelizar clientes.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, description, gradient, borderSelected, glow, glowSelected }, i) => {
            const isSelected = selected === i

            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 32 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
                transition={{ duration: 0.55, ease: EASE, delay: i * 0.1 }}
                onClick={() => setSelected(isSelected ? null : i)}
                className={`
                  relative rounded-2xl border backdrop-blur-sm p-6 space-y-4
                  cursor-pointer select-none
                  transition-all duration-300
                  ${isSelected
                    ? `${borderSelected} bg-slate-900/80 -translate-y-1.5 shadow-2xl ${glowSelected}`
                    : 'border-white/5 bg-slate-900/50 hover:-translate-y-1.5 hover:border-white/10 hover:bg-slate-900/70 hover:shadow-xl'
                  }
                  ${selected !== null && !isSelected ? 'opacity-60' : 'opacity-100'}
                `}
              >
                {/* Gradient fill — visible cuando está seleccionado */}
                <div
                  className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} transition-opacity duration-300 ${
                    isSelected ? 'opacity-[0.12]' : 'opacity-0'
                  }`}
                />

                {/* Icon */}
                <div className={`relative h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${isSelected ? glowSelected : glow}`}>
                  <Icon size={20} className="text-white" strokeWidth={1.8} />
                </div>

                <div className="relative space-y-2">
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
