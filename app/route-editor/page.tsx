'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })

// Hilfskomponente für Map-Events
function MapEvents({ onClick }: { onClick: (e: any) => void }) {
  const { useMapEvents } = require('react-leaflet')
  useMapEvents({
    click: onClick,
  })
  return null
}

if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css')
}

export default function RouteEditor() {
  const [isClient, setIsClient] = useState(false)
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])
  const [routeName, setRouteName] = useState('')
  const [fromStation, setFromStation] = useState('')
  const [toStation, setToStation] = useState('')

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleMapClick = (e: any) => {
    const { lat, lng } = e.latlng
    setRoutePoints([...routePoints, [lat, lng]])
  }

  const generateRouteCode = () => {
    if (routePoints.length < 2 || !routeName || !fromStation || !toStation) {
      return 'Bitte füllen Sie alle Felder aus und fügen Sie mindestens 2 Punkte hinzu.'
    }

    const coordinates = routePoints.map(p => `    [${p[0]}, ${p[1]}],`).join('\n')

    return `{
  id: 'route-${Date.now()}',
  name: '${routeName}',
  from: '${fromStation}',
  to: '${toStation}',
  coordinates: [
${coordinates}
  ],
},`
  }

  const clearRoute = () => {
    setRoutePoints([])
    setRouteName('')
    setFromStation('')
    setToStation('')
  }

  if (!isClient) {
    return <div>Lädt...</div>
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Routen-Editor</h1>
        <p className="text-sm opacity-90">Klicken Sie auf die Karte, um Punkte für eine Route hinzuzufügen</p>
      </div>
      
      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <MapContainer
            center={[47.3, 8.6]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <MapEvents onClick={handleMapClick} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <TileLayer
              attribution='&copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors'
              url="http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
              opacity={0.7}
            />

            {/* Gezeichnete Route */}
            {routePoints.length > 1 && (
              <Polyline
                positions={routePoints}
                pathOptions={{
                  color: '#ec4899',
                  weight: 4,
                  opacity: 0.8,
                }}
              />
            )}

            {/* Marker für jeden Punkt */}
            {routePoints.map((point, index) => (
              <Marker key={index} position={point}>
                <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="w-96 bg-white p-4 overflow-y-auto shadow-xl">
          <h2 className="text-xl font-bold mb-4">Route definieren</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Routenname</label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="z.B. Zürich Bürkliplatz → Rapperswil"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Von Station</label>
              <input
                type="text"
                value={fromStation}
                onChange={(e) => setFromStation(e.target.value)}
                placeholder="z.B. Zürich Bürkliplatz (See)"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Zu Station</label>
              <input
                type="text"
                value={toStation}
                onChange={(e) => setToStation(e.target.value)}
                placeholder="z.B. Rapperswil SG (See)"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Punkte: {routePoints.length}</label>
              <button
                onClick={clearRoute}
                className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
              >
                Route löschen
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Generierter Code</label>
              <textarea
                readOnly
                value={generateRouteCode()}
                className="w-full p-2 border rounded font-mono text-xs"
                rows={15}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateRouteCode())
                  alert('Code in Zwischenablage kopiert!')
                }}
                className="mt-2 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Code kopieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
