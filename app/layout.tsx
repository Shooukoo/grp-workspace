import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://repairlab-liard.vercel.app/'),
  title: {
    template: '%s | RepairLab Enterprise',
    default: 'RepairLab Enterprise — Gestiona tu Taller de Reparación',
  },
  description: 'Plataforma líder para la gestión de talleres de reparación, seguimiento de órdenes, inventario y finanzas en la nube.',
  keywords: [
    'taller reparación',
    'software taller',
    'gestión órdenes',
    'RepairLab',
    'SaaS',
    'reparación electrónica',
    'ERP para talleres'
  ],
  authors: [{ name: 'Santiago Nuñez' }],
  creator: 'Santiago Nuñez',
  publisher: 'Santiago Nuñez',
  openGraph: {
    title: 'RepairLab Enterprise — El sistema operativo para tu taller',
    description: 'El sistema definitivo para talleres de reparación. Simplifica tus procesos y aumenta tus ganancias.',
    siteName: 'RepairLab Enterprise',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RepairLab Enterprise',
    description: 'El sistema definitivo para talleres de reparación. Simplifica tus procesos y aumenta tus ganancias.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full w-full antialiased`}
    >
      <body className="min-h-full w-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
