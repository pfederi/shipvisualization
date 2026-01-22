'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import { renderToString } from 'react-dom/server'
import { Anchor, Ship as ShipIcon, Crown } from 'lucide-react'
import { ShipPosition } from '@/lib/ship-position'
import { ZURICHSEE_STATIONS } from '@/lib/zurichsee-stations'
import { getCachedGeoJSONRoutes } from '@/lib/geojson-routes'
import type { ShipRouteData } from '@/lib/geojson-routes'

import 'leaflet/dist/leaflet.css'

interface ShipMapProps {
  ships?: ShipPosition[]
  onShipClick?: (ship: ShipPosition) => void
  selectedShipId?: string | null
}

export default function ShipMap({ ships = [], onShipClick, selectedShipId }: ShipMapProps) {
  const [isClient, setIsClient] = useState(false)
  const mapInitialized = useRef(false)

  useEffect(() => {
    setIsClient(true)
    if (!mapInitialized.current) {
      mapInitialized.current = true
      getCachedGeoJSONRoutes().catch(console.error)
    }
  }, [])

  // Station Icon (einmalig erstellt)
  const stationIcon = useMemo(() => {
    if (typeof window === 'undefined') return null
    const L = require('leaflet')
    const anchorHtml = renderToString(
      <div className="bg-white rounded-full p-1 shadow-lg border-2 border-brandblue flex items-center justify-center">
        <Anchor size={16} className="text-brandblue" />
      </div>
    )
    return L.divIcon({
      className: 'custom-station-icon',
      html: anchorHtml,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
  }, [])

  // Ship Icons pro Kurs (gecached)
  const shipIcons = useMemo(() => {
    if (typeof window === 'undefined') return new Map<string, any>()
    const L = require('leaflet')
    const icons = new Map<string, any>()
    
    ships.forEach(ship => {
      const course = Math.round(ship.course || 0)
      const isAlbis = ship.name?.includes('MS Albis')
      const isSelected = selectedShipId === ship.id
      const iconKey = `${ship.name}-${course}-${isSelected}`
      
      if (!icons.has(iconKey)) {
        const shipHtml = renderToString(
          <div style={{ transform: `rotate(${course}deg)` }} className="flex items-center justify-center relative cursor-pointer">
            {isSelected && (
              <div 
                className="absolute inset-0 -m-1.5 border-[3px] border-brandblue rounded-full shadow-[0_0_10px_rgba(12,39,74,0.8)]" 
              />
            )}
            {isAlbis && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                <Crown 
                  size={22} 
                  className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_2px_rgba(255,255,255,1)] filter drop-shadow-[0_0_1px_white]" 
                />
              </div>
            )}
            <div 
              className={`bg-red-500 rounded-full p-1.5 shadow-xl border-2 flex items-center justify-center ${isSelected ? 'border-brandblue' : 'border-white'}`}
            >
              <ShipIcon size={20} className="text-white" />
            </div>
          </div>
        )
        icons.set(iconKey, L.divIcon({
          className: 'custom-ship-icon',
          html: shipHtml,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }))
      }
    })
    
    return icons
  }, [ships, selectedShipId])

  if (!isClient) return null

  return (
    <div className="flex-1 relative h-full w-full" id="ship-map-container">
      <MapContainer
        center={[47.3, 8.6]}
        zoom={12}
        className="absolute inset-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Stationen */}
        {stationIcon && ZURICHSEE_STATIONS.map((station, index) => (
          <Marker
            key={`station-${index}`}
            position={[station.latitude, station.longitude]}
            icon={stationIcon}
          />
        ))}

        {/* Schiffe */}
        {ships.map((ship) => {
          const course = Math.round(ship.course || 0)
          const isSelected = selectedShipId === ship.id
          const iconKey = `${ship.name}-${course}-${isSelected}`
          const icon = shipIcons.get(iconKey)
          if (!icon) return null

          return (
            <Marker
              key={ship.id}
              position={[ship.latitude, ship.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onShipClick?.(ship),
              }}
            >
              <Tooltip direction="top" offset={[0, -15]} opacity={1}>
                <div className="font-bold text-gray-900">{ship.name || 'Schiff'}</div>
              </Tooltip>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
