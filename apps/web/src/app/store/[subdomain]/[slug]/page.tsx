'use client'

import { useParams } from 'next/navigation'
import { StorefrontShell } from '@/components/storefront/StorefrontShell'

export default function StorefrontCustomPage() {
  const params = useParams()
  const slug = params.slug as string

  return <StorefrontShell page="custom" slug={slug} />
}
