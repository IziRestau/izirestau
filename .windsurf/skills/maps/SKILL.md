# Skill: Cartes & Géolocalisation (Mapbox)

## Quand utiliser ce skill
- Affichage de cartes
- Zones de livraison
- Tracking livreurs
- Sélection d'adresse

---

## Configuration

### Variables d'environnement
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
```

### Installation
```bash
pnpm --filter web add mapbox-gl @types/mapbox-gl
```

---

## Composants

### Map de base
```tsx
// components/shared/Map.tsx
'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface MapProps {
  center?: [number, number]
  zoom?: number
  className?: string
  onMapLoad?: (map: mapboxgl.Map) => void
}

export function Map({ 
  center = [-17.4677, 14.7167], // Dakar par défaut
  zoom = 12,
  className,
  onMapLoad,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    mapRef.current.on('load', () => {
      onMapLoad?.(mapRef.current!)
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={mapContainer} className={className} />
}
```

### Marker
```tsx
// components/shared/MapMarker.tsx
'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

interface MapMarkerProps {
  map: mapboxgl.Map
  position: [number, number]
  color?: string
  popup?: string
}

export function MapMarker({ map, position, color = '#f97316', popup }: MapMarkerProps) {
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    markerRef.current = new mapboxgl.Marker({ color })
      .setLngLat(position)
      .addTo(map)

    if (popup) {
      markerRef.current.setPopup(
        new mapboxgl.Popup().setHTML(popup)
      )
    }

    return () => {
      markerRef.current?.remove()
    }
  }, [map, position, color, popup])

  return null
}
```

### Zone de livraison
```tsx
// components/restaurant/DeliveryZoneMap.tsx
'use client'

import { useState, useCallback } from 'react'
import { Map } from '@/components/shared/Map'
import mapboxgl from 'mapbox-gl'

interface DeliveryZone {
  id: string
  name: string
  coordinates: [number, number][]
  deliveryFee: number
  minOrder: number
}

interface DeliveryZoneMapProps {
  zones: DeliveryZone[]
  center: [number, number]
  onZoneClick?: (zone: DeliveryZone) => void
}

export function DeliveryZoneMap({ zones, center, onZoneClick }: DeliveryZoneMapProps) {
  const handleMapLoad = useCallback((map: mapboxgl.Map) => {
    zones.forEach((zone, index) => {
      const sourceId = `zone-${zone.id}`
      const layerId = `zone-layer-${zone.id}`

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { ...zone },
          geometry: {
            type: 'Polygon',
            coordinates: [zone.coordinates],
          },
        },
      })

      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': getZoneColor(index),
          'fill-opacity': 0.3,
        },
      })

      map.addLayer({
        id: `${layerId}-outline`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': getZoneColor(index),
          'line-width': 2,
        },
      })

      map.on('click', layerId, () => {
        onZoneClick?.(zone)
      })

      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = ''
      })
    })
  }, [zones, onZoneClick])

  return (
    <Map
      center={center}
      zoom={13}
      className="h-96 w-full rounded-lg"
      onMapLoad={handleMapLoad}
    />
  )
}

function getZoneColor(index: number) {
  const colors = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6']
  return colors[index % colors.length]
}
```

### Tracking Livreur
```tsx
// components/storefront/DeliveryTracker.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Map } from '@/components/shared/Map'
import { useDriverLocation } from '@/hooks/useDriverLocation'
import mapboxgl from 'mapbox-gl'

interface DeliveryTrackerProps {
  orderId: string
  restaurantPosition: [number, number]
  deliveryPosition: [number, number]
}

export function DeliveryTracker({
  orderId,
  restaurantPosition,
  deliveryPosition,
}: DeliveryTrackerProps) {
  const driverLocation = useDriverLocation(orderId)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null)

  const handleMapLoad = (map: mapboxgl.Map) => {
    mapRef.current = map

    // Marker restaurant
    new mapboxgl.Marker({ color: '#f97316' })
      .setLngLat(restaurantPosition)
      .setPopup(new mapboxgl.Popup().setHTML('<b>Restaurant</b>'))
      .addTo(map)

    // Marker destination
    new mapboxgl.Marker({ color: '#22c55e' })
      .setLngLat(deliveryPosition)
      .setPopup(new mapboxgl.Popup().setHTML('<b>Livraison</b>'))
      .addTo(map)

    // Fit bounds
    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend(restaurantPosition)
    bounds.extend(deliveryPosition)
    map.fitBounds(bounds, { padding: 50 })
  }

  // Mettre à jour la position du livreur
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return

    const position: [number, number] = [driverLocation.lng, driverLocation.lat]

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat(position)
        .setPopup(new mapboxgl.Popup().setHTML('<b>Livreur</b>'))
        .addTo(mapRef.current)
    } else {
      driverMarkerRef.current.setLngLat(position)
    }
  }, [driverLocation])

  return (
    <Map
      center={restaurantPosition}
      zoom={14}
      className="h-64 w-full rounded-lg"
      onMapLoad={handleMapLoad}
    />
  )
}
```

---

## Geocoding

### Service Geocoding
```typescript
// services/geocoding.service.ts
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export const geocodingService = {
  async search(query: string): Promise<GeocodingResult[]> {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=SN,FR&language=fr`
    )
    const data = await res.json()
    
    return data.features.map((f: any) => ({
      id: f.id,
      name: f.place_name,
      coordinates: f.center as [number, number],
      address: f.properties.address,
      city: f.context?.find((c: any) => c.id.startsWith('place'))?.text,
    }))
  },

  async reverse(lng: number, lat: number): Promise<string> {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=fr`
    )
    const data = await res.json()
    return data.features[0]?.place_name || ''
  },
}

interface GeocodingResult {
  id: string
  name: string
  coordinates: [number, number]
  address?: string
  city?: string
}
```

### Composant AddressSearch
```tsx
// components/shared/AddressSearch.tsx
'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { geocodingService } from '@/services/geocoding.service'
import { useDebounce } from '@/hooks/useDebounce'

interface AddressSearchProps {
  value?: string
  onSelect: (result: { address: string; coordinates: [number, number] }) => void
}

export function AddressSearch({ value, onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([])
      return
    }

    geocodingService.search(debouncedQuery).then(setResults)
  }, [debouncedQuery])

  const handleSelect = (result: any) => {
    setQuery(result.name)
    setIsOpen(false)
    onSelect({
      address: result.name,
      coordinates: result.coordinates,
    })
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher une adresse..."
          className="pl-9"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{result.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Calcul de distance

```typescript
// utils/geo.ts
export function calculateDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = toRad(point2[1] - point1[1])
  const dLon = toRad(point2[0] - point1[0])
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1[1])) *
      Math.cos(toRad(point2[1])) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Vérifier si un point est dans une zone
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  let inside = false
  const x = point[0]
  const y = point[1]

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]
    const yi = polygon[i][1]
    const xj = polygon[j][0]
    const yj = polygon[j][1]

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}
```
