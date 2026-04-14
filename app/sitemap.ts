import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://repairlab.app'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Si tuvieras un blog o más páginas estáticas (precios, faq), las agregarías aquí.
    // Por el momento, concentramos todo el peso en el Landing Page.
  ]
}
