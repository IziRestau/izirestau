export interface DeliveryZone {
  id: string
  name: string
  polygon: Array<{ lat: number; lng: number }>
  addresses: string[] | null
  deliveryFee: number
  minOrderAmount: number | null
  estimatedTime: number | null
  isActive: boolean
  priority: number
  createdAt?: string
  updatedAt?: string
}
