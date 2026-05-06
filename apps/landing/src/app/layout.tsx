import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export const metadata: Metadata = {
  title: {
    default: 'IziRestau — Plateforme SaaS pour Revendeurs Restaurant',
    template: '%s | IziRestau',
  },
  description: 'La plateforme tout-en-un pour les revendeurs de solutions restaurant. Gérez vos clients, créez des sites, suivez vos revenus.',
  keywords: ['restaurant', 'SaaS', 'revendeur', 'plateforme', 'gestion restaurant', 'commande en ligne'],
  authors: [{ name: 'IziRestau' }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'IziRestau',
    title: 'IziRestau — Plateforme SaaS pour Revendeurs Restaurant',
    description: 'La plateforme tout-en-un pour les revendeurs de solutions restaurant.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IziRestau — Plateforme SaaS pour Revendeurs Restaurant',
    description: 'La plateforme tout-en-un pour les revendeurs de solutions restaurant.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
