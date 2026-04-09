'use client'

import { motion } from 'framer-motion'

/**
 * Dashboard template — re-renders on every navigation (unlike layout.tsx which persists).
 * This is what drives the smooth page-to-page fade-in animation.
 */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}
