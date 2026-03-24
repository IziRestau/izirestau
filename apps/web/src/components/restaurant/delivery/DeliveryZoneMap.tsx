'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, Undo2, Check, X, Edit3, Move } from 'lucide-react'
import { api, apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { DeliveryZone } from './types'

interface DeliveryZoneMapProps {
  zones: DeliveryZone[]
  center?: { lat: number; lng: number }
  zoom?: number
  onZoneClick?: (zone: DeliveryZone) => void
  isDrawing?: boolean
  onDrawComplete?: (polygon: Array<{ lat: number; lng: number }>) => void
  onCancelDrawing?: () => void
  onZoneUpdate?: (zoneId: string, polygon: Array<{ lat: number; lng: number }>) => void
  selectedZoneId?: string | null
  primaryColor?: string
  restaurantMarker?: { lat: number; lng: number; name?: string } | null
}

interface PointAddress {
  lat: number
  lng: number
  address: string | null
  loading: boolean
}

export function DeliveryZoneMap({
  zones = [],
  center = { lat: 48.8566, lng: 2.3522 },
  zoom = 13,
  onZoneClick,
  isDrawing = false,
  onDrawComplete,
  onCancelDrawing,
  onZoneUpdate,
  selectedZoneId,
  primaryColor = '#10b981',
  restaurantMarker,
}: DeliveryZoneMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const polygonsRef = useRef<Map<string, L.Polygon>>(new Map())
  const markersRef = useRef<L.Marker[]>([])
  const restaurantMarkerRef = useRef<L.Marker | null>(null)
  const drawingPointsRef = useRef<Array<{ lat: number; lng: number }>>([])
  const drawingPolygonRef = useRef<L.Polygon | null>(null)
  const drawingMarkersRef = useRef<L.Marker[]>([])
  const editMarkersRef = useRef<L.Marker[]>([])
  
  const [drawingPoints, setDrawingPoints] = useState<Array<{ lat: number; lng: number }>>([])
  const [pointAddresses, setPointAddresses] = useState<PointAddress[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)
  const [editPoints, setEditPoints] = useState<Array<{ lat: number; lng: number }>>([])

  const getZoneColor = useCallback((zone: DeliveryZone) => {
    if (!zone.isActive) return '#9ca3af'
    if (zone.id === selectedZoneId) return primaryColor
    if (zone.id === editingZoneId) return '#f59e0b'
    return '#3b82f6'
  }, [selectedZoneId, primaryColor, editingZoneId])

  const getZoneOpacity = useCallback((zone: DeliveryZone) => {
    if (!zone.isActive) return 0.2
    if (zone.id === selectedZoneId || zone.id === editingZoneId) return 0.4
    return 0.3
  }, [selectedZoneId, editingZoneId])

  const { accessToken } = useAuthStore()

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    try {
      if (accessToken) apiClient.setAccessToken(accessToken)
      const response = await api.restaurant.reverseGeocodeAddress(lat, lng)
      return response.data?.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }, [accessToken])

  const updatePointAddresses = useCallback(async (points: Array<{ lat: number; lng: number }>) => {
    setPointAddresses(points.map(p => ({ ...p, address: null, loading: true })))
    
    const results: PointAddress[] = []
    for (const p of points) {
      await new Promise(resolve => setTimeout(resolve, 200))
      const address = await reverseGeocode(p.lat, p.lng)
      results.push({ ...p, address, loading: false })
      setPointAddresses([...results, ...points.slice(results.length).map(pt => ({ ...pt, address: null, loading: true }))])
    }
  }, [reverseGeocode])

  const createDraggableMarker = useCallback((
    point: { lat: number; lng: number },
    index: number,
    onDrag: (index: number, lat: number, lng: number) => void,
    color: string = '#3b82f6'
  ) => {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">${index + 1}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    const marker = L.marker([point.lat, point.lng], {
      icon,
      draggable: true,
    })

    marker.on('drag', (e) => {
      const target = e.target as L.Marker
      const pos = target.getLatLng()
      onDrag(index, pos.lat, pos.lng)
    })

    return marker
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const initialCenter = restaurantMarker || center
    mapRef.current = L.map(mapContainerRef.current).setView([initialCenter.lat, initialCenter.lng], zoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    if (restaurantMarkerRef.current) {
      restaurantMarkerRef.current.remove()
      restaurantMarkerRef.current = null
    }

    if (restaurantMarker) {
      const icon = L.divIcon({
        className: 'restaurant-marker',
        html: `<div style="
          width: 36px;
          height: 36px;
          background: ${primaryColor};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <path d="M7 2v20"/>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })

      restaurantMarkerRef.current = L.marker([restaurantMarker.lat, restaurantMarker.lng], { icon })
        .addTo(mapRef.current)

      if (restaurantMarker.name) {
        restaurantMarkerRef.current.bindTooltip(restaurantMarker.name, {
          permanent: false,
          direction: 'top',
          offset: [0, -20],
        })
      }
    }
  }, [restaurantMarker, primaryColor])

  useEffect(() => {
    if (!mapRef.current || isDrawing || isEditing) return

    polygonsRef.current.forEach(p => p.remove())
    polygonsRef.current.clear()

    const safeZones = Array.isArray(zones) ? zones : []
    
    safeZones.forEach(zone => {
      if (!zone.polygon || !Array.isArray(zone.polygon)) return
      
      const polygon = L.polygon(
        zone.polygon.map(p => [p.lat, p.lng] as L.LatLngExpression),
        {
          color: getZoneColor(zone),
          fillColor: getZoneColor(zone),
          fillOpacity: getZoneOpacity(zone),
          weight: zone.id === selectedZoneId ? 3 : 2,
        }
      )

      polygon.on('click', () => {
        if (!isDrawing && !isEditing) {
          onZoneClick?.(zone)
        }
      })
      
      polygon.addTo(mapRef.current!)
      polygonsRef.current.set(zone.id, polygon)
    })
  }, [zones, selectedZoneId, primaryColor, onZoneClick, isDrawing, isEditing, getZoneColor, getZoneOpacity])

  useEffect(() => {
    if (!mapRef.current || !selectedZoneId || isDrawing || isEditing) return

    const selectedZone = zones.find(z => z.id === selectedZoneId)
    if (selectedZone?.polygon && selectedZone.polygon.length > 0) {
      const bounds = L.latLngBounds(selectedZone.polygon.map(p => [p.lat, p.lng] as L.LatLngTuple))
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [selectedZoneId, zones, isDrawing, isEditing])

  const startEditing = useCallback((zone: DeliveryZone) => {
    if (!mapRef.current || !zone.polygon) return
    
    setIsEditing(true)
    setEditingZoneId(zone.id)
    setEditPoints([...zone.polygon])

    editMarkersRef.current.forEach(m => m.remove())
    editMarkersRef.current = []

    const existingPolygon = polygonsRef.current.get(zone.id)
    if (existingPolygon) {
      existingPolygon.setStyle({ 
        color: '#f59e0b', 
        fillColor: '#f59e0b',
        dashArray: '5, 5',
      })
    }

    zone.polygon.forEach((point, index) => {
      const marker = createDraggableMarker(
        point,
        index,
        (idx, lat, lng) => {
          setEditPoints(prev => {
            const newPoints = [...prev]
            newPoints[idx] = { lat, lng }
            
            const polygon = polygonsRef.current.get(zone.id)
            if (polygon) {
              polygon.setLatLngs(newPoints.map(p => [p.lat, p.lng]))
            }
            
            return newPoints
          })
        },
        '#f59e0b'
      )
      marker.addTo(mapRef.current!)
      editMarkersRef.current.push(marker)
    })
  }, [createDraggableMarker])

  const cancelEditing = useCallback(() => {
    editMarkersRef.current.forEach(m => m.remove())
    editMarkersRef.current = []
    
    if (editingZoneId) {
      const zone = zones.find(z => z.id === editingZoneId)
      const polygon = polygonsRef.current.get(editingZoneId)
      if (polygon && zone?.polygon) {
        polygon.setLatLngs(zone.polygon.map(p => [p.lat, p.lng]))
        polygon.setStyle({
          color: getZoneColor(zone),
          fillColor: getZoneColor(zone),
          dashArray: undefined,
        })
      }
    }
    
    setIsEditing(false)
    setEditingZoneId(null)
    setEditPoints([])
  }, [editingZoneId, zones, getZoneColor])

  const saveEditing = useCallback(() => {
    if (editingZoneId && editPoints.length >= 3) {
      onZoneUpdate?.(editingZoneId, editPoints)
    }
    
    editMarkersRef.current.forEach(m => m.remove())
    editMarkersRef.current = []
    
    setIsEditing(false)
    setEditingZoneId(null)
    setEditPoints([])
  }, [editingZoneId, editPoints, onZoneUpdate])

  const updateDrawingPolygon = useCallback(() => {
    if (!mapRef.current) return

    if (drawingPolygonRef.current) {
      drawingPolygonRef.current.remove()
    }

    drawingMarkersRef.current.forEach(m => m.remove())
    drawingMarkersRef.current = []

    if (drawingPointsRef.current.length >= 2) {
      drawingPolygonRef.current = L.polygon(
        drawingPointsRef.current.map(p => [p.lat, p.lng] as L.LatLngExpression),
        {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.3,
          weight: 2,
          dashArray: '5, 5',
        }
      ).addTo(mapRef.current)
    }

    drawingPointsRef.current.forEach((point, index) => {
      const marker = createDraggableMarker(
        point,
        index,
        (idx, lat, lng) => {
          drawingPointsRef.current[idx] = { lat, lng }
          setDrawingPoints([...drawingPointsRef.current])
          updatePointAddresses(drawingPointsRef.current)
          
          if (drawingPolygonRef.current) {
            drawingPolygonRef.current.setLatLngs(
              drawingPointsRef.current.map(p => [p.lat, p.lng])
            )
          }
        },
        '#3b82f6'
      )
      marker.addTo(mapRef.current!)
      drawingMarkersRef.current.push(marker)
    })
  }, [createDraggableMarker, updatePointAddresses])

  const handleFinishDrawing = useCallback(() => {
    if (drawingPointsRef.current.length >= 3) {
      onDrawComplete?.(drawingPointsRef.current)
    }
    if (drawingPolygonRef.current) {
      drawingPolygonRef.current.remove()
      drawingPolygonRef.current = null
    }
    drawingMarkersRef.current.forEach(m => m.remove())
    drawingMarkersRef.current = []
    drawingPointsRef.current = []
    setDrawingPoints([])
    setPointAddresses([])
  }, [onDrawComplete])

  const handleUndoLastPoint = useCallback(() => {
    if (drawingPointsRef.current.length > 0) {
      drawingPointsRef.current = drawingPointsRef.current.slice(0, -1)
      setDrawingPoints([...drawingPointsRef.current])
      updatePointAddresses(drawingPointsRef.current)
      updateDrawingPolygon()
    }
  }, [updateDrawingPolygon, updatePointAddresses])

  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current

    if (isDrawing) {
      map.doubleClickZoom.disable()
      drawingPointsRef.current = []
      setDrawingPoints([])
      setPointAddresses([])

      const handleClick = (e: L.LeafletMouseEvent) => {
        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng }
        drawingPointsRef.current = [...drawingPointsRef.current, newPoint]
        setDrawingPoints([...drawingPointsRef.current])
        updatePointAddresses(drawingPointsRef.current)
        updateDrawingPolygon()
      }

      map.on('click', handleClick)

      return () => {
        map.off('click', handleClick)
        map.doubleClickZoom.enable()
        if (drawingPolygonRef.current) {
          drawingPolygonRef.current.remove()
          drawingPolygonRef.current = null
        }
        drawingMarkersRef.current.forEach(m => m.remove())
        drawingMarkersRef.current = []
      }
    } else {
      map.doubleClickZoom.enable()
      if (drawingPolygonRef.current) {
        drawingPolygonRef.current.remove()
        drawingPolygonRef.current = null
      }
      drawingMarkersRef.current.forEach(m => m.remove())
      drawingMarkersRef.current = []
      drawingPointsRef.current = []
      setDrawingPoints([])
      setPointAddresses([])
    }
  }, [isDrawing, updateDrawingPolygon, updatePointAddresses])

  const selectedZone = zones.find(z => z.id === selectedZoneId)

  const SelectedZoneAddresses = ({ polygon, storedAddresses, primaryColor: color }: { polygon: Array<{ lat: number; lng: number }>, storedAddresses: string[] | null, primaryColor: string }) => {
    const displayAddresses = storedAddresses && storedAddresses.length === polygon.length
      ? polygon.map((p, i) => ({ lat: p.lat, lng: p.lng, address: storedAddresses[i] }))
      : polygon.map(p => ({ lat: p.lat, lng: p.lng, address: `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` }))

    return (
      <div className="bg-white rounded-lg p-3 border border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
          <Navigation size={12} />
          Adresses de la zone ({displayAddresses.length} points)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-24 overflow-y-auto">
          {displayAddresses.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span 
                className="w-5 h-5 rounded-full text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                style={{ backgroundColor: color }}
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
    )
  }

  return (
    <div className="space-y-3">
      {/* Controles de dessin - en dehors de la carte */}
      {isDrawing && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-blue-700">
              <MapPin size={16} />
              <span className="text-sm font-medium">
                Cliquez sur la carte pour ajouter des points ({drawingPoints.length}/3 min)
              </span>
            </div>
            <div className="flex gap-2">
              {drawingPoints.length > 0 && (
                <button
                  onClick={handleUndoLastPoint}
                  className="bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 border border-gray-200 flex items-center gap-1"
                >
                  <Undo2 size={14} />
                  Retirer dernier
                </button>
              )}
              {drawingPoints.length >= 3 && (
                <button
                  onClick={handleFinishDrawing}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 flex items-center gap-1"
                >
                  <Check size={14} />
                  Valider la zone
                </button>
              )}
              <button
                onClick={onCancelDrawing}
                className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-600 flex items-center gap-1"
              >
                <X size={14} />
                Annuler
              </button>
            </div>
          </div>
          
          {pointAddresses.length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <Navigation size={12} />
                Points de la zone ({pointAddresses.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pointAddresses.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="text-gray-600 truncate">
                      {p.loading ? 'Chargement...' : p.address || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controles d'edition - en dehors de la carte */}
      {isEditing && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-amber-700">
              <Move size={16} />
              <span className="text-sm font-medium">Deplacez les points sur la carte pour modifier la zone</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelEditing}
                className="bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 border border-gray-200 flex items-center gap-1"
              >
                <X size={14} />
                Annuler
              </button>
              <button
                onClick={saveEditing}
                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 flex items-center gap-1"
              >
                <Check size={14} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zone selectionnee avec adresses - en dehors de la carte */}
      {!isDrawing && !isEditing && selectedZone && onZoneUpdate && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Zone selectionnee: <strong>{selectedZone.name}</strong>
            </span>
            <button
              onClick={() => startEditing(selectedZone)}
              className="bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 border border-gray-200 flex items-center gap-2"
            >
              <Edit3 size={14} />
              Modifier les points
            </button>
          </div>
          {selectedZone.polygon && selectedZone.polygon.length > 0 && (
            <SelectedZoneAddresses polygon={selectedZone.polygon} storedAddresses={selectedZone.addresses} primaryColor={primaryColor} />
          )}
        </div>
      )}

      {/* Carte */}
      <div className="relative w-full rounded-xl overflow-hidden border border-gray-200">
        <div ref={mapContainerRef} className="w-full" style={{ height: '500px' }} />
      </div>
    </div>
  )
}
