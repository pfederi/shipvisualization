'use client'

import { ShipPosition } from '@/lib/ship-position'
import { Ship, Clock, Navigation, Crown } from 'lucide-react'

interface SchedulePanelProps {
  ships?: ShipPosition[]
  selectedShipId?: string | null
  onShipClick?: (shipId: string) => void
  isLoading?: boolean
}

export default function SchedulePanel({ ships = [], selectedShipId, onShipClick, isLoading }: SchedulePanelProps) {
  if (isLoading) {
    return (
      <div className="w-96 bg-white shadow-xl overflow-y-auto z-20 flex flex-col">
        <div className="p-4 border-b sticky top-0 bg-white flex items-center gap-2">
          <Ship className="text-brandblue" size={24} />
          <h2 className="text-xl font-bold">Aktive Schiffe</h2>
        </div>
        <div className="p-4 flex flex-col items-center justify-center py-12 flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brandblue mb-4"></div>
          <p className="text-gray-500 text-center animate-pulse">
            Fahrplan-Daten werden geladen...
          </p>
          <p className="text-[10px] text-gray-400 mt-2">
            Dies kann einige Sekunden dauern
          </p>
        </div>
        <div className="p-4 border-t border-gray-200 mt-auto">
          <p className="text-[9px] text-gray-400 text-center leading-relaxed">
            © {new Date().getFullYear()} Created by{' '}
            <a 
              href="https://lakeshorestudios.ch/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brandblue underline hover:no-underline"
            >
              lakeshorestudios
            </a>
            <br />
            Made with AI
          </p>
        </div>
      </div>
    )
  }

  if (ships.length === 0) {
    return (
      <div className="w-96 bg-white shadow-xl overflow-y-auto z-20 flex flex-col">
        <div className="p-4 border-b sticky top-0 bg-white flex items-center gap-2">
          <Ship className="text-brandblue" size={24} />
          <h2 className="text-xl font-bold">Aktive Schiffe</h2>
        </div>
        <div className="p-4 flex-1">
          <p className="text-gray-500 text-center py-8">
            Keine aktiven Schiffe
          </p>
        </div>
        <div className="p-4 border-t border-gray-200 mt-auto">
          <p className="text-[9px] text-gray-400 text-center leading-relaxed">
            © {new Date().getFullYear()} Created by{' '}
            <a 
              href="https://lakeshorestudios.ch/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brandblue underline hover:no-underline"
            >
              lakeshorestudios
            </a>
            <br />
            Made with AI
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-96 bg-white shadow-xl overflow-y-auto z-20 flex flex-col">
      <div className="p-4 border-b sticky top-0 bg-white flex items-center gap-2">
        <Ship className="text-brandblue" size={24} />
        <h2 className="text-xl font-bold">Aktive Schiffe ({ships.length})</h2>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {ships.map((ship) => {
          const isAlbis = ship.name?.includes('MS Albis')
          
          return (
            <div
              key={ship.id}
              onClick={() => onShipClick?.(ship.id)}
              className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                selectedShipId === ship.id
                  ? 'border-brandblue bg-brandblue/5 shadow-md transform scale-[1.02]'
                  : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200 shadow-sm'
              }`}
            >
              <div className="mb-3">
                <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg leading-tight flex items-center gap-2 text-brandblue">
                  <span className="flex-1">{ship.name || 'Unbekanntes Schiff'}</span>
                  {isAlbis && <Crown size={20} className="text-yellow-500 fill-yellow-500 flex-shrink-0 -translate-y-0.5" />}
                </h3>
                  {(ship.internalCourseNumber || ship.courseNumber) && (
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-brandblue/10 text-brandblue"
                    >
                      Kurs {(ship.internalCourseNumber || ship.courseNumber || '').toString().replace(/^0+/, '')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  <Navigation size={12} className="text-gray-400" />
                  {ship.fromStation} → {ship.toStation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 rounded border bg-white shadow-sm border-brandblue/20">
                  <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1 uppercase font-bold tracking-wider">
                    <Clock size={10} className="text-brandblue" />
                    Abfahrt
                  </div>
                  <p className="font-mono font-bold text-gray-900">
                    {ship.departureTime
                      ? new Date(ship.departureTime).toLocaleTimeString('de-CH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 truncate">
                    {ship.fromStation || '—'}
                  </p>
                </div>

                <div className="p-2 rounded border bg-white shadow-sm border-brandblue/20">
                  <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1 uppercase font-bold tracking-wider">
                    <Clock size={10} className="text-brandblue" />
                    Ankunft
                  </div>
                  <p className="font-mono font-bold text-gray-900">
                    {ship.arrivalTime
                      ? new Date(ship.arrivalTime).toLocaleTimeString('de-CH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 truncate">
                    {ship.toStation || ship.nextStop || '—'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="p-4 border-t border-gray-200 mt-auto">
        <p className="text-[11px] text-gray-800 text-center leading-relaxed">
          © {new Date().getFullYear()} Created by{' '}
          <a 
            href="https://lakeshorestudios.ch/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-brandblue underline hover:no-underline"
          >
            lakeshorestudios
          </a>
          <br />
          Made with AI
        </p>
      </div>
    </div>
  )
}
