import { permanentRedirect } from 'next/navigation'

interface EditCampaignPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { id } = await params
  permanentRedirect(`/restaurant/marketing/campaigns/new?id=${id}`)
}
