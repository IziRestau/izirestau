'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, MapPin, Clock, Navigation } from 'lucide-react'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { DeliveryZone } from './types'

interface PointAddress {
  lat: number
  lng: number
  address: string | null
  loading: boolean
}

interface DeliveryZoneModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    polygon: Array<{ lat: number; lng: number }>
    addresses: string[]
    deliveryFee: number
    minOrderAmount?: number
    estimatedTime?: number
    priority: number
    isActive?: boolean
  }) => Promise<void>
  zone?: DeliveryZone | null
  drawnPolygon?: Array<{ lat: number; lng: number }> | null
  isLoading?: boolean
  primaryColor?: string
}

export function DeliveryZoneModal({
  isOpen,
  onClose,
  onSubmit,
  zone,
  drawnPolygon,
  isLoading = false,
  primaryColor = '#10b981',
}: DeliveryZoneModalProps) {
  const { accessToken } = useAuthStore()
  const [pointAddresses, setPointAddresses] = useState<PointAddress[]>([])
  const [formData, setFormData] = useState({
    name: '',
    deliveryFee: 0,
    minOrderAmount: '',
    estimatedTime: '',
    priority: 0,
    isActive: true,
  })

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name,
        deliveryFee: zone.deliveryFee,
        minOrderAmount: zone.minOrderAmount?.toString() || '',
        estimatedTime: zone.estimatedTime?.toString() || '',
        priority: zone.priority,
        isActive: zone.isActive,
      })
    } else {
      setFormData({
        name: '',
        deliveryFee: 0,
        minOrderAmount: '',
        estimatedTime: '',
        priority: 0,
        isActive: true,
      })
    }
  }, [zone, isOpen])

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const response = await api.restaurant.reverseGeocodeAddress(lat, lng)
      return response.data?.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }, [accessToken])

  useEffect(() => {
    const polygon = zone?.polygon || drawnPolygon
    if (isOpen && polygon && polygon.length > 0) {
      if (zone?.addresses && zone.addresses.length === polygon.length) {
        setPointAddresses(polygon.map((p, i) => ({ lat: p.lat, lng: p.lng, address: zone.addresses![i], loading: false })))
      } else {
        setPointAddresses(polygon.map(p => ({ lat: p.lat, lng: p.lng, address: null, loading: true })))
        
        const fetchAddresses = async () => {
          const results: PointAddress[] = []
          for (const p of polygon) {
            await new Promise(resolve => setTimeout(resolve, 200))
            const address = await reverseGeocode(p.lat, p.lng)
            results.push({ lat: p.lat, lng: p.lng, address, loading: false })
            setPointAddresses([...results, ...polygon.slice(results.length).map(pt => ({ lat: pt.lat, lng: pt.lng, address: null, loading: true }))])
          }
        }
        fetchAddresses()
      }
    } else {
      setPointAddresses([])
    }
  }, [isOpen, zone?.polygon, zone?.addresses, drawnPolygon, reverseGeocode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const polygon = zone?.polygon || drawnPolygon
    if (!polygon || polygon.length < 3) {
      return
    }

    const addresses = pointAddresses.map(p => p.address || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`)

    await onSubmit({
      name: formData.name,
      polygon,
      addresses,
      deliveryFee: formData.deliveryFee,
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
      estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : undefined,
      priority: formData.priority,
      isActive: formData.isActive,
    })
  }

  const isEditing = !!zone
  const { symbol: currencySymbol } = useRestaurantCurrency()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la zone' : 'Nouvelle zone de livraison'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la zone *</Label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Centre-ville"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryFee">Frais de livraison ({currencySymbol})</Label>
              <Input
                id="deliveryFee"
                type="number"
                min={0}
                step={0.5}
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOrderAmount">Commande min. ({currencySymbol})</Label>
              <Input
                id="minOrderAmount"
                type="number"
                min={0}
                step={1}
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                placeholder="Optionnel"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Temps estime (min)</Label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="estimatedTime"
                  type="number"
                  min={5}
                  max={120}
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                  placeholder="Optionnel"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorite</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                max={100}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500">Plus eleve = prioritaire</p>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Zone active</p>
                <p className="text-xs text-gray-500">Desactiver pour masquer temporairement</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                style={{ '--switch-checked-bg': primaryColor } as React.CSSProperties}
                className="data-[state=checked]:bg-[--switch-checked-bg]"
              />
            </div>
          )}

          {/* Affichage des points et adresses */}
          {pointAddresses.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <Navigation size={12} />
                {isEditing ? 'Points de la zone' : 'Zone dessinee'} ({pointAddresses.length} points)
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {pointAddresses.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span 
                      className="w-5 h-5 rounded-full text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-gray-600">
                      {p.loading ? 'Chargement...' : p.address || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name || (!zone?.polygon && !drawnPolygon)}
              className="flex-1 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {isEditing ? 'Modification...' : 'Creation...'}
                </>
              ) : (
                isEditing ? 'Modifier' : 'Creer la zone'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
