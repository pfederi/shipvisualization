'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import { renderToString } from 'react-dom/server'
import { Anchor, Ship as ShipIcon, Crown } from 'lucide-react'
import { ShipPosition } from '@/lib/ship-position'
import { LAKES, LakeConfig, Station } from '@/lib/lakes-config'
import { getCachedGeoJSONRoutes } from '@/lib/geojson-routes'

import 'leaflet/dist/leaflet.css'

interface ShipMapProps {
  ships?: ShipPosition[]
  onShipClick?: (ship: ShipPosition) => void
  onStationClick?: (station: Station) => void
  selectedShipId?: string | null
  selectedLakeId?: string
  stations?: Station[]
}

export default function ShipMap({ ships = [], onShipClick, onStationClick, selectedShipId, selectedLakeId = 'zurichsee', stations = [] }: ShipMapProps) {
  const [isClient, setIsClient] = useState(false)
  const mapInitialized = useRef(false)
  const selectedLake = useMemo(() => LAKES[selectedLakeId], [selectedLakeId])

  useEffect(() => {
    setIsClient(true)
    if (!mapInitialized.current) {
      mapInitialized.current = true
    }
    
    // Lade GeoJSON-Routen und logge die Anzahl
    getCachedGeoJSONRoutes(selectedLake.geojsonPath)
      .then(routes => {
        console.log(`🗺️ ShipMap: ${routes.length} GeoJSON-Routen geladen für ${selectedLake.name}`)
      })
      .catch(error => {
        console.error(`❌ ShipMap: Fehler beim Laden der GeoJSON-Routen:`, error)
      })
  }, [selectedLake.geojsonPath, selectedLake.name])

  // Station Icon (einmalig erstellt)
  const stationIcon = useMemo(() => {
    if (typeof window === 'undefined') return null
    const L = require('leaflet')
    const anchorHtml = renderToString(
      <div className="bg-white rounded-full p-0.5 shadow-md border border-brandblue flex items-center justify-center">
        <Anchor size={10} className="text-brandblue" />
      </div>
    )
    return L.divIcon({
      className: 'custom-station-icon',
      html: anchorHtml,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
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
            <div 
              className={`rounded-full p-1.5 shadow-xl border-2 border-white flex items-center justify-center ${isSelected ? 'ring-2 ring-brandblue ring-offset-1' : ''}`}
              style={{ backgroundColor: '#0c274a' }}
            >
              <ShipIcon size={20} className={isAlbis ? 'text-yellow-400' : 'text-white'} />
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
        key={selectedLakeId} // Force remount when lake changes
        center={selectedLake.center}
        zoom={selectedLake.zoom}
        className="absolute inset-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Stationen */}
        {stationIcon && stations.map((station, index) => (
          <Marker
            key={`${selectedLakeId}-station-${index}`}
            position={[station.latitude, station.longitude]}
            icon={stationIcon}
            eventHandlers={{
              click: () => onStationClick?.(station),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
              <div className="text-xs font-semibold text-gray-900">{station.name}</div>
            </Tooltip>
          </Marker>
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
                <div className="font-bold text-gray-900 dark:text-gray-100">{ship.name || 'Schiff'}</div>
              </Tooltip>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
