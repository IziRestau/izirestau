'use client'

import { useState, useCallback } from 'react'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  MapPin,
  Navigation,
  Circle,
  Plus,
  Trash2,
  Loader2,
  Search,
  Pencil,
} from 'lucide-react'

type CreationMethod = 'draw' | 'addresses' | 'radius' | 'coordinates'

interface ZoneCreationMethodsProps {
  onPolygonCreated: (polygon: Array<{ lat: number; lng: number }>) => void
  onStartDrawing: () => void
  onCancel: () => void
  primaryColor?: string
  restaurantLocation?: { lat: number; lng: number } | null
}

interface AddressPoint {
  id: string
  address: string
  lat: number | null
  lng: number | null
  loading: boolean
}

interface CoordinatePoint {
  id: string
  lat: string
  lng: string
}

export function ZoneCreationMethods({
  onPolygonCreated,
  onStartDrawing,
  onCancel,
  primaryColor = '#10b981',
  restaurantLocation,
}: ZoneCreationMethodsProps) {
  const { accessToken } = useAuthStore()
  const [method, setMethod] = useState<CreationMethod | null>(null)
  
  const [addresses, setAddresses] = useState<AddressPoint[]>([
    { id: '1', address: '', lat: null, lng: null, loading: false },
    { id: '2', address: '', lat: null, lng: null, loading: false },
    { id: '3', address: '', lat: null, lng: null, loading: false },
  ])

  const [radiusCenter, setRadiusCenter] = useState('')
  const [radiusCenterCoords, setRadiusCenterCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [radiusKm, setRadiusKm] = useState('5')
  const [radiusLoading, setRadiusLoading] = useState(false)

  const [coordinates, setCoordinates] = useState<CoordinatePoint[]>([
    { id: '1', lat: '', lng: '' },
    { id: '2', lat: '', lng: '' },
    { id: '3', lat: '', lng: '' },
  ])

  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const response = await api.restaurant.geocodeAddress(address)
      if (response.data?.latitude && response.data?.longitude) {
        return { lat: response.data.latitude, lng: response.data.longitude }
      }
      return null
    } catch {
      return null
    }
  }, [accessToken])

  const handleAddressChange = (id: string, value: string) => {
    setAddresses(prev => prev.map(a => 
      a.id === id ? { ...a, address: value, lat: null, lng: null } : a
    ))
  }

  const handleGeocodeAddress = async (id: string) => {
    const point = addresses.find(a => a.id === id)
    if (!point || !point.address.trim()) return

    setAddresses(prev => prev.map(a => 
      a.id === id ? { ...a, loading: true } : a
    ))

    const coords = await geocodeAddress(point.address)
    
    setAddresses(prev => prev.map(a => 
      a.id === id ? { ...a, lat: coords?.lat || null, lng: coords?.lng || null, loading: false } : a
    ))

    if (!coords) {
      toast.error(`Adresse non trouvee: ${point.address}`)
    }
  }

  const addAddressPoint = () => {
    setAddresses(prev => [...prev, { 
      id: Date.now().toString(), 
      address: '', 
      lat: null, 
      lng: null, 
      loading: false 
    }])
  }

  const removeAddressPoint = (id: string) => {
    if (addresses.length <= 3) return
    setAddresses(prev => prev.filter(a => a.id !== id))
  }

  const handleCreateFromAddresses = () => {
    const validPoints = addresses.filter(a => a.lat !== null && a.lng !== null)
    if (validPoints.length < 3) {
      toast.error('Au moins 3 adresses valides sont requises')
      return
    }
    const polygon = validPoints.map(p => ({ lat: p.lat!, lng: p.lng! }))
    onPolygonCreated(polygon)
  }

  const handleGeocodeRadiusCenter = async () => {
    if (!radiusCenter.trim()) return
    setRadiusLoading(true)
    const coords = await geocodeAddress(radiusCenter)
    setRadiusLoading(false)
    
    if (coords) {
      setRadiusCenterCoords(coords)
      toast.success('Centre trouve')
    } else {
      toast.error('Adresse non trouvee')
    }
  }

  const useRestaurantAsCenter = () => {
    if (restaurantLocation) {
      setRadiusCenterCoords({ lat: restaurantLocation.lat, lng: restaurantLocation.lng })
      setRadiusCenter('Adresse du restaurant')
      toast.success('Centre defini sur le restaurant')
    } else {
      toast.error('Coordonnees du restaurant non configurees')
    }
  }

  const handleCreateFromRadius = () => {
    if (!radiusCenterCoords) {
      toast.error('Veuillez definir le centre')
      return
    }
    const radius = parseFloat(radiusKm)
    if (isNaN(radius) || radius <= 0) {
      toast.error('Rayon invalide')
      return
    }

    const points = 32
    const polygon: Array<{ lat: number; lng: number }> = []
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI
      const latOffset = (radius / 111) * Math.cos(angle)
      const lngOffset = (radius / (111 * Math.cos(radiusCenterCoords.lat * Math.PI / 180))) * Math.sin(angle)
      
      polygon.push({
        lat: radiusCenterCoords.lat + latOffset,
        lng: radiusCenterCoords.lng + lngOffset,
      })
    }

    onPolygonCreated(polygon)
  }

  const addCoordinatePoint = () => {
    setCoordinates(prev => [...prev, { id: Date.now().toString(), lat: '', lng: '' }])
  }

  const removeCoordinatePoint = (id: string) => {
    if (coordinates.length <= 3) return
    setCoordinates(prev => prev.filter(c => c.id !== id))
  }

  const handleCoordinateChange = (id: string, field: 'lat' | 'lng', value: string) => {
    setCoordinates(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  const handleCreateFromCoordinates = () => {
    const validPoints = coordinates.filter(c => {
      const lat = parseFloat(c.lat)
      const lng = parseFloat(c.lng)
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    })

    if (validPoints.length < 3) {
      toast.error('Au moins 3 coordonnees valides sont requises')
      return
    }

    const polygon = validPoints.map(c => ({
      lat: parseFloat(c.lat),
      lng: parseFloat(c.lng),
    }))

    onPolygonCreated(polygon)
  }

  if (!method) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Comment voulez-vous creer la zone ?</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onStartDrawing}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors text-left"
          >
            <Pencil size={20} className="mb-2" style={{ color: primaryColor }} />
            <p className="text-sm font-medium text-gray-900">Dessiner sur la carte</p>
            <p className="text-xs text-gray-500 mt-1">Cliquez pour placer les points</p>
          </button>
          
          <button
            onClick={() => setMethod('addresses')}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors text-left"
          >
            <MapPin size={20} className="mb-2" style={{ color: primaryColor }} />
            <p className="text-sm font-medium text-gray-900">Par adresses</p>
            <p className="text-xs text-gray-500 mt-1">Entrez plusieurs adresses</p>
          </button>
          
          <button
            onClick={() => setMethod('radius')}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors text-left"
          >
            <Circle size={20} className="mb-2" style={{ color: primaryColor }} />
            <p className="text-sm font-medium text-gray-900">Par rayon</p>
            <p className="text-xs text-gray-500 mt-1">Cercle autour d'un point</p>
          </button>
          
          <button
            onClick={() => setMethod('coordinates')}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors text-left"
          >
            <Navigation size={20} className="mb-2" style={{ color: primaryColor }} />
            <p className="text-sm font-medium text-gray-900">Par coordonnees GPS</p>
            <p className="text-xs text-gray-500 mt-1">Saisie manuelle lat/lng</p>
          </button>
        </div>
      </div>
    )
  }

  if (method === 'addresses') {
    const validCount = addresses.filter(a => a.lat !== null).length
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Creation par adresses</h4>
          <button onClick={() => setMethod(null)} className="text-xs text-gray-500 hover:text-gray-700">
            Changer de methode
          </button>
        </div>
        
        <p className="text-xs text-gray-500">
          Entrez au moins 3 adresses pour definir les limites de la zone
        </p>

        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {addresses.map((point, index) => (
            <div key={point.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-5">{index + 1}.</span>
              <div className="flex-1 relative">
                <Input
                  value={point.address}
                  onChange={(e) => handleAddressChange(point.id, e.target.value)}
                  placeholder="Entrez une adresse..."
                  className="h-10 pr-10 rounded-lg text-sm"
                />
                {point.lat !== null && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleGeocodeAddress(point.id)}
                disabled={point.loading || !point.address.trim()}
                className="h-10 w-10 p-0"
              >
                {point.loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
              </Button>
              {addresses.length > 3 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAddressPoint(point.id)}
                  className="h-10 w-10 p-0 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAddressPoint}
          className="w-full"
        >
          <Plus size={14} className="mr-1" />
          Ajouter une adresse
        </Button>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-gray-500">
            {validCount}/3 adresses minimum
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleCreateFromAddresses}
              disabled={validCount < 3}
              className="text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Creer la zone
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (method === 'radius') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Creation par rayon</h4>
          <button onClick={() => setMethod(null)} className="text-xs text-gray-500 hover:text-gray-700">
            Changer de methode
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Adresse du centre</Label>
            <div className="flex gap-2">
              <Input
                value={radiusCenter}
                onChange={(e) => {
                  setRadiusCenter(e.target.value)
                  setRadiusCenterCoords(null)
                }}
                placeholder="Entrez l'adresse centrale..."
                className="h-10 rounded-lg text-sm flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeocodeRadiusCenter}
                disabled={radiusLoading || !radiusCenter.trim()}
                className="h-10"
              >
                {radiusLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
              </Button>
            </div>
            {restaurantLocation && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={useRestaurantAsCenter}
                className="text-xs h-8"
              >
                <MapPin size={12} className="mr-1" />
                Utiliser l'adresse du restaurant
              </Button>
            )}
            {radiusCenterCoords && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Centre: {radiusCenterCoords.lat.toFixed(6)}, {radiusCenterCoords.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Rayon (km)</Label>
            <Input
              type="number"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              placeholder="5"
              min="0.1"
              step="0.1"
              className="h-10 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleCreateFromRadius}
            disabled={!radiusCenterCoords}
            className="text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Creer la zone
          </Button>
        </div>
      </div>
    )
  }

  if (method === 'coordinates') {
    const validCount = coordinates.filter(c => {
      const lat = parseFloat(c.lat)
      const lng = parseFloat(c.lng)
      return !isNaN(lat) && !isNaN(lng)
    }).length

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Creation par coordonnees GPS</h4>
          <button onClick={() => setMethod(null)} className="text-xs text-gray-500 hover:text-gray-700">
            Changer de methode
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Entrez au moins 3 paires de coordonnees (latitude, longitude)
        </p>

        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {coordinates.map((point, index) => (
            <div key={point.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-5">{index + 1}.</span>
              <Input
                type="number"
                value={point.lat}
                onChange={(e) => handleCoordinateChange(point.id, 'lat', e.target.value)}
                placeholder="Latitude"
                step="any"
                className="h-10 rounded-lg text-sm flex-1"
              />
              <Input
                type="number"
                value={point.lng}
                onChange={(e) => handleCoordinateChange(point.id, 'lng', e.target.value)}
                placeholder="Longitude"
                step="any"
                className="h-10 rounded-lg text-sm flex-1"
              />
              {coordinates.length > 3 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCoordinatePoint(point.id)}
                  className="h-10 w-10 p-0 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCoordinatePoint}
          className="w-full"
        >
          <Plus size={14} className="mr-1" />
          Ajouter un point
        </Button>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-gray-500">
            {validCount}/3 points minimum
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleCreateFromCoordinates}
              disabled={validCount < 3}
              className="text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Creer la zone
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
