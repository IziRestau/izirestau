import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IziResto',
  description: 'Plateforme SaaS pour revendeurs de solutions restaurant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster 
          position="bottom-right" 
          closeButton
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#1e2128',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '16px',
            },
          }}
        />
      </body>
    </html>
  )
}
