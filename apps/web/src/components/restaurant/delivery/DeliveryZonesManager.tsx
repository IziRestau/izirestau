'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { DeliveryZoneModal } from './DeliveryZoneModal'
import { ZoneCreationMethods } from './ZoneCreationMethods'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/ui/button'
import { DeliveryZone } from './types'
import {
  Plus,
  MapPin,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Map,
  Clock,
  ChevronDown,
  ChevronUp,
  Navigation,
} from 'lucide-react'

function ZoneAddressesList({ polygon, addresses, primaryColor }: { polygon: Array<{ lat: number; lng: number }>, addresses: string[] | null, primaryColor: string }) {
  const displayAddresses = addresses && addresses.length === polygon.length
    ? polygon.map((p, i) => ({ lat: p.lat, lng: p.lng, address: addresses[i], loading: false }))
    : polygon.map(p => ({ lat: p.lat, lng: p.lng, address: `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`, loading: false }))

  return (
    <div className="px-3 pb-3 pt-0">
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
          <Navigation size={12} />
          Adresses de la zone
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
          {displayAddresses.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span 
                className="w-5 h-5 rounded-full text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {i + 1}
              </span>
              <span className="text-gray-600 truncate">
                {p.address}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const DeliveryZoneMap = dynamic(
  () => import('./DeliveryZoneMap').then(mod => ({ default: mod.DeliveryZoneMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    ),
  }
)

interface DeliveryZonesManagerProps {
  restaurantId: string
  restaurantLocation?: { lat: number; lng: number; name?: string } | null
  primaryColor?: string
  onUpdate?: () => void
}

export function DeliveryZonesManager({
  restaurantId,
  restaurantLocation,
  primaryColor = '#10b981',
  onUpdate,
}: DeliveryZonesManagerProps) {
  const defaultLocation = { lat: 48.8566, lng: 2.3522 }
  const mapCenter = restaurantLocation || defaultLocation
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const { format: formatCurrency } = useRestaurantCurrency()
  const [isDrawing, setIsDrawing] = useState(false)
  const [showCreationMethods, setShowCreationMethods] = useState(false)
  const [drawnPolygon, setDrawnPolygon] = useState<Array<{ lat: number; lng: number }> | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeliveryZone | null>(null)
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null)

  const { data: zonesResponse, isLoading } = useQuery({
    queryKey: ['delivery-zones', restaurantId],
    queryFn: async () => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.getDeliveryZones()
    },
    enabled: !!accessToken && !!restaurantId,
  })

  const zones: DeliveryZone[] = (zonesResponse as any)?.data || zonesResponse || []

  const createMutation = useMutation({
    mutationFn: async (data: Parameters<typeof api.restaurant.createDeliveryZone>[0]) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.createDeliveryZone(data)
    },
    onSuccess: () => {
      toast.success('Zone creee')
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      setShowModal(false)
      setDrawnPolygon(null)
      onUpdate?.()
    },
    onError: () => {
      toast.error('Erreur lors de la creation')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Parameters<typeof api.restaurant.updateDeliveryZone>[1] }) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.updateDeliveryZone(id, data)
    },
    onSuccess: () => {
      toast.success('Zone modifiee')
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      setShowModal(false)
      setSelectedZone(null)
      onUpdate?.()
    },
    onError: () => {
      toast.error('Erreur lors de la modification')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.deleteDeliveryZone(id)
    },
    onSuccess: () => {
      toast.success('Zone supprimee')
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      setDeleteConfirm(null)
      onUpdate?.()
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      if (accessToken) apiClient.setAccessToken(accessToken)
      return api.restaurant.toggleDeliveryZone(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      onUpdate?.()
    },
    onError: () => {
      toast.error('Erreur lors du changement de statut')
    },
  })

  const handleDrawComplete = (polygon: Array<{ lat: number; lng: number }>) => {
    setDrawnPolygon(polygon)
    setIsDrawing(false)
    setShowCreationMethods(false)
    setShowModal(true)
  }

  const handlePolygonFromMethods = (polygon: Array<{ lat: number; lng: number }>) => {
    setDrawnPolygon(polygon)
    setShowCreationMethods(false)
    setShowModal(true)
  }

  const handleStartDrawing = () => {
    setShowCreationMethods(false)
    setIsDrawing(true)
  }

  const handleCancelCreation = () => {
    setShowCreationMethods(false)
    setIsDrawing(false)
  }

  const handleZoneClick = (zone: DeliveryZone) => {
    if (isDrawing) return
    setSelectedZone(prev => prev?.id === zone.id ? null : zone)
  }

  const handleZoneUpdate = async (zoneId: string, polygon: Array<{ lat: number; lng: number }>) => {
    if (accessToken) apiClient.setAccessToken(accessToken)
    try {
      await api.restaurant.updateDeliveryZone(zoneId, { polygon })
      toast.success('Points de la zone mis a jour')
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      onUpdate?.()
    } catch {
      toast.error('Erreur lors de la mise a jour des points')
    }
  }

  const handleEdit = (zone: DeliveryZone) => {
    setSelectedZone(zone)
    setShowModal(true)
  }

  const handleSubmit = async (data: {
    name: string
    polygon: Array<{ lat: number; lng: number }>
    addresses: string[]
    deliveryFee: number
    minOrderAmount?: number
    estimatedTime?: number
    priority: number
    isActive?: boolean
  }) => {
    if (selectedZone) {
      await updateMutation.mutateAsync({
        id: selectedZone.id,
        data: {
          name: data.name,
          addresses: data.addresses,
          deliveryFee: data.deliveryFee,
          minOrderAmount: data.minOrderAmount,
          estimatedTime: data.estimatedTime,
          priority: data.priority,
          isActive: data.isActive,
        },
      })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedZone(null)
    setDrawnPolygon(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Zones de livraison</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Definissez vos zones avec des frais specifiques
          </p>
        </div>
        {!isDrawing && !showCreationMethods && (
          <Button
            size="sm"
            onClick={() => setShowCreationMethods(true)}
            className="text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={16} className="mr-1" />
            Nouvelle zone
          </Button>
        )}
      </div>

      {showCreationMethods && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <ZoneCreationMethods
            onPolygonCreated={handlePolygonFromMethods}
            onStartDrawing={handleStartDrawing}
            onCancel={handleCancelCreation}
            primaryColor={primaryColor}
            restaurantLocation={restaurantLocation}
          />
        </div>
      )}

      {isLoading ? (
        <div className="h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <DeliveryZoneMap
          zones={zones}
          center={mapCenter}
          zoom={14}
          isDrawing={isDrawing}
          onDrawComplete={handleDrawComplete}
          onCancelDrawing={handleCancelCreation}
          onZoneClick={handleZoneClick}
          onZoneUpdate={handleZoneUpdate}
          selectedZoneId={selectedZone?.id}
          primaryColor={primaryColor}
          restaurantMarker={restaurantLocation}
        />
      )}

      {zones.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {zones.length} zone{zones.length > 1 ? 's' : ''} configuree{zones.length > 1 ? 's' : ''}
          </h5>
          <div className="space-y-2">
            {zones.map(zone => (
              <div
                key={zone.id}
                className={`rounded-xl border transition-colors ${
                  zone.isActive 
                    ? 'bg-white border-gray-200 hover:border-gray-300' 
                    : 'bg-gray-50 border-gray-100'
                } ${selectedZone?.id === zone.id ? 'ring-2' : ''}`}
                style={{ 
                  '--tw-ring-color': selectedZone?.id === zone.id ? primaryColor : undefined 
                } as React.CSSProperties}
              >
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => handleZoneClick(zone)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        zone.isActive ? '' : 'opacity-50'
                      }`}
                      style={{ backgroundColor: zone.isActive ? `${primaryColor}20` : '#f3f4f6' }}
                    >
                      <MapPin size={18} style={{ color: zone.isActive ? primaryColor : '#9ca3af' }} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${zone.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {zone.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatCurrency(zone.deliveryFee)}</span>
                        {zone.minOrderAmount && (
                          <span>Min: {formatCurrency(zone.minOrderAmount)}</span>
                        )}
                        {zone.estimatedTime && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {zone.estimatedTime} min
                          </span>
                        )}
                        <span className="text-gray-400">({zone.polygon?.length || 0} points)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedZoneId(expandedZoneId === zone.id ? null : zone.id)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Voir les adresses"
                    >
                      {expandedZoneId === zone.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleMutation.mutate(zone.id)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={zone.isActive ? 'Desactiver' : 'Activer'}
                    >
                      {zone.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(zone)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(zone)
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {expandedZoneId === zone.id && zone.polygon && zone.polygon.length > 0 && (
                  <ZoneAddressesList polygon={zone.polygon} addresses={zone.addresses} primaryColor={primaryColor} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {zones.length === 0 && !isLoading && (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Map size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mb-3">Aucune zone de livraison configuree</p>
          <Button
            size="sm"
            onClick={() => setIsDrawing(true)}
            className="text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={16} className="mr-1" />
            Dessiner une zone
          </Button>
        </div>
      )}

      <DeliveryZoneModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        zone={selectedZone}
        drawnPolygon={drawnPolygon}
        isLoading={createMutation.isPending || updateMutation.isPending}
        primaryColor={primaryColor}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        title="Supprimer la zone"
        message={`Voulez-vous vraiment supprimer la zone "${deleteConfirm?.name}" ?`}
        confirmText="Supprimer"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  )
}
