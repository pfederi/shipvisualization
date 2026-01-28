'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl } from 'react-leaflet'
import { renderToString } from 'react-dom/server'
import { Anchor, Ship as ShipIcon, Crown, ChevronDown, X } from 'lucide-react'
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
  availableLakes?: Array<{ id: string; name: string }>
  onLakeChange?: (lakeId: string) => void
}

export default function ShipMap({ ships = [], onShipClick, onStationClick, selectedShipId, selectedLakeId = 'zurichsee', stations = [], availableLakes = [], onLakeChange }: ShipMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mapInitialized = useRef(false)
  const selectedLake = useMemo(() => LAKES[selectedLakeId], [selectedLakeId])
  
  // Detect mobile
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const handleLakeSelect = (lakeId: string) => {
    if (onLakeChange) {
      onLakeChange(lakeId)
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="flex-1 relative h-full w-full" id="ship-map-container">
      {/* Lake Selection - Top Left */}
      {availableLakes.length > 0 && onLakeChange && (
        <>
          {/* Desktop: Dropdown */}
          <div className="hidden lg:block absolute top-3 left-3 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="relative">
              <select 
                value={selectedLakeId} 
                onChange={(e) => onLakeChange(e.target.value)}
                className="bg-transparent text-gray-900 dark:text-white text-sm font-black px-4 py-2 pr-10 rounded-lg outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors appearance-none"
              >
                {availableLakes.map(lake => (
                  <option key={lake.id} value={lake.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    {lake.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown 
                size={16} 
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400" 
              />
            </div>
          </div>

          {/* Mobile: Button that opens modal */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden absolute top-3 left-3 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 flex items-center gap-2 min-w-[140px]"
          >
            <span className="text-gray-900 dark:text-white text-sm font-black flex-1 text-left">
              {selectedLake?.name.toUpperCase() || 'SEE WÄHLEN'}
            </span>
            <ChevronDown size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
          </button>

          {/* Mobile: Modal/Bottom Sheet */}
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="lg:hidden fixed inset-0 bg-black/50"
                style={{ zIndex: 10000 }}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              
              {/* Bottom Sheet */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col" style={{ zIndex: 10001 }}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">See auswählen</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                
                {/* Lake List */}
                <div className="overflow-y-auto flex-1">
                  {availableLakes.map(lake => (
                    <button
                      key={lake.id}
                      onClick={() => handleLakeSelect(lake.id)}
                      className={`w-full px-4 py-4 text-left border-b border-gray-100 dark:border-gray-700 transition-colors ${
                        selectedLakeId === lake.id
                          ? 'bg-brandblue/10 dark:bg-brandblue/20 text-brandblue dark:text-brandblue-light'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="text-base font-semibold">{lake.name}</div>
                      {selectedLakeId === lake.id && (
                        <div className="text-xs text-brandblue dark:text-brandblue-light mt-0.5">Aktuell ausgewählt</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <MapContainer
        key={selectedLakeId} // Force remount when lake changes
        center={selectedLake.center}
        zoom={selectedLake.zoom}
        className="absolute inset-0"
        scrollWheelZoom={true}
        zoomControl={false} // Disable default zoom control
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Zoom Control - Top Right */}
        <ZoomControl position="topright" />
        
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
