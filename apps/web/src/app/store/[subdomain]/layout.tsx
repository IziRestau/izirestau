import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Commander en ligne',
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
