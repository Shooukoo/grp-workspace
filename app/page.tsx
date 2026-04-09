import type { Metadata } from 'next'
import Navbar         from '@/app/_components/landing/Navbar'
import HeroSection    from '@/app/_components/landing/HeroSection'
import FeaturesSection from '@/app/_components/landing/FeaturesSection'
import PricingSection from '@/app/_components/landing/PricingSection'
import FAQSection     from '@/app/_components/landing/FAQSection'
import Footer         from '@/app/_components/landing/Footer'

export const metadata: Metadata = {
  title: 'RepairLab Enterprise — El sistema operativo para tu taller de reparación',
  description:
    'Gestiona órdenes, técnicos y clientes en un solo panel. SaaS multi-tenant diseñado para talleres de reparación electrónica. Solicita acceso ahora.',
  keywords: ['taller reparación', 'software taller', 'gestión órdenes', 'RepairLab', 'SaaS México'],
  openGraph: {
    title: 'RepairLab Enterprise',
    description: 'El sistema operativo definitivo para tu taller de reparación.',
    type: 'website',
  },
}

/**
 * Public landing page — Server Component for optimal SEO.
 * All animated sections are extracted into Client Components under /app/_components/landing/.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#080b14] text-white">
      <Navbar />
      <main className="w-full">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
