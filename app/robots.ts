import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://repairlab.app'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/login',
        '/api/*',
        '/admin*',
        '/seguimiento/*', 
        '/print/*'
        // Excluimos las tutas privadas por seguridad en el robots.txt también
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
