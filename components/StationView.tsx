'use client'

import { Station } from '@/lib/lakes-config'
import { useI18n } from '@/lib/i18n-context'
import { useTheme } from '@/lib/theme'
import { useEffect, useState } from 'react'
import { getStationboard, StationboardEntry } from '@/lib/transport-api'
import { getShipNameByCourseNumber } from '@/lib/ship-names-api'
import { Ship, Clock, Crown } from 'lucide-react'

interface StationViewProps {
  selectedStation: Station
  selectedDate?: string
  selectedLakeId?: string
  isLiveMode?: boolean
  simulationTime?: string
  isMobile?: boolean
}

export default function StationView({
  selectedStation,
  selectedDate,
  selectedLakeId,
  isLiveMode = false,
  simulationTime,
  isMobile = false
}: StationViewProps) {
  const { t, language } = useI18n()
  const { theme } = useTheme()
  const [stationDepartures, setStationDepartures] = useState<(StationboardEntry & { shipName?: string })[]>([])

  // Lade Abfahrten wenn Station ausgewählt
  useEffect(() => {
    const stationKey = selectedStation.uic_ref || selectedStation.name
    const date = selectedDate || new Date().toISOString().split('T')[0]
    const time = '00:00' // Lade alle Abfahrten ab Mitternacht
    
    console.log(`🔍 Lade Abfahrten für Station: "${selectedStation.name}" (${stationKey})`)
    
    // Lade direkt von API (wird automatisch gecacht bis Mitternacht)
    getStationboard(stationKey, date, time)
      .then(async entries => {
        console.log(`📊 Station ${selectedStation.name}: ${entries.length} Einträge geladen`)
        
        // Filtere nur Schiffsabfahrten
        const shipDepartures = entries.filter(e => {
          const cat = e.category?.toLowerCase() || ''
          return cat.includes('bat') || 
                 cat.includes('ship') || 
                 cat.includes('ferry') || 
                 cat.includes('boat') ||
                 cat === 'b'
        })
        
        console.log(`   Schiffsabfahrten gefiltert: ${shipDepartures.length}`)
        
        // Für Zürichsee: Hole Schiffsnamen direkt von der API
        if (selectedLakeId === 'zurichsee') {
          const targetDate = new Date(date)
          
          // Hole Schiffsnamen parallel für alle Abfahrten
          const departuresWithShipNames = await Promise.all(
            shipDepartures.map(async dep => {
              // Extrahiere interne Kursnummer aus dem Namen (z.B. "B 29" -> "29")
              const internalNumRaw = dep.name.match(/\d+/)?.[0] || "0"
              const internalNumShort = internalNumRaw.replace(/^0+/, '') || "0"
              
              try {
                const shipName = await getShipNameByCourseNumber(internalNumShort, targetDate)
                return { ...dep, shipName: shipName || undefined }
              } catch (error) {
                console.warn(`Fehler beim Laden des Schiffsnamens für Kurs ${internalNumShort}:`, error)
                return { ...dep, shipName: undefined }
              }
            })
          )
          
          console.log(`   🚢 ${departuresWithShipNames.filter(d => d.shipName).length} von ${departuresWithShipNames.length} Schiffsnamen geladen`)
          setStationDepartures(departuresWithShipNames)
        } else {
          setStationDepartures(shipDepartures)
        }
      })
      .catch(err => {
        console.error('Fehler beim Laden der Stationsdaten:', err)
        setStationDepartures([])
      })
  }, [selectedStation, selectedDate, selectedLakeId])

  // Berechne aktuelle Zeit
  const now = isLiveMode ? new Date() : new Date(`${selectedDate}T${simulationTime}`)
  
  // Trenne zukünftige und vergangene Abfahrten
  const futureDepartures = stationDepartures.filter(dep => {
    const depTime = new Date(dep.stop.departure || '')
    const minutesUntil = Math.round((depTime.getTime() - now.getTime()) / 60000)
    return minutesUntil >= 0
  })
  
  const pastDepartures = stationDepartures.filter(dep => {
    const depTime = new Date(dep.stop.departure || '')
    const minutesUntil = Math.round((depTime.getTime() - now.getTime()) / 60000)
    return minutesUntil < 0
  }).reverse() // Neueste vergangene Abfahrten zuerst

  return (
    <div className={`flex flex-col h-full`}>
      {/* Abfahrten */}
      <div className={`flex-1 ${isMobile ? 'pb-32' : 'pb-24'}`}>
        {stationDepartures.length === 0 ? (
          <div className="p-4">
            <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Keine Abfahrten gefunden
            </p>
          </div>
        ) : (
          <>
            {/* Zukünftige Abfahrten */}
            {futureDepartures.length > 0 && (
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider px-4 py-3 sticky top-[114px] z-10 ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'}`}>
                  Nächste Abfahrten
                </h4>
                <div className="px-4 pb-4 space-y-2">
                  {futureDepartures.map((departure, idx) => {
                    const depTime = new Date(departure.stop.departure || '')
                    const minutesUntil = Math.round((depTime.getTime() - now.getTime()) / 60000)
                    
                    // Für Rundfahrten: Zeige die nächste Station aus der passList statt dem Endziel
                    let destination = departure.to
                    const currentStationName = selectedStation.name
                    const isRoundTrip = departure.to === currentStationName || 
                                       departure.to?.toLowerCase().includes(currentStationName.toLowerCase().split(' ')[0])
                    
                    // Wenn es eine Rundfahrt ist oder eine passList vorhanden ist, zeige die nächste Station
                    if (departure.passList && departure.passList.length > 0) {
                      // Die passList enthält alle kommenden Stationen (ohne die aktuelle)
                      // Nimm die erste Station als nächstes Ziel
                      const passList = departure.passList // Type narrowing für TypeScript
                      const nextStop = passList[0]
                      if (nextStop?.station?.name) {
                        destination = nextStop.station.name
                      }
                    }
                    
                    return (
                      <div
                        key={`future-${idx}`}
                        className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            {/* Schiffsname (nur Zürichsee) */}
                            {departure.shipName && (
                              <div className="flex items-center gap-1 mb-1">
                                <Ship size={12} className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                                <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {departure.shipName}
                                </span>
                                {departure.shipName.includes('MS Albis') && (
                                  <Crown size={14} className="text-yellow-500 fill-yellow-500 -translate-y-0.5" />
                                )}
                              </div>
                            )}
                            <div className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {destination}
                            </div>
                          </div>
                          {departure.name && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-brandblue/30 text-white' : 'bg-brandblue/10 text-brandblue'}`}>
                              {t.course} {(departure.name || '').replace(/\b0+(\d+)/g, '$1')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {depTime.toLocaleTimeString(language === 'de' ? 'de-CH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className={`text-xs ${minutesUntil <= 5 ? 'text-red-500 font-semibold' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {minutesUntil === 0 ? 'Jetzt' : `in ${minutesUntil} Min`}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Vergangene Abfahrten */}
            {pastDepartures.length > 0 && (
              <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider px-4 py-3 sticky top-[114px] z-10 ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'}`}>
                  Vergangene Abfahrten
                </h4>
                <div className="px-4 pb-4 space-y-2">
                  {pastDepartures.map((departure, idx) => {
                    const depTime = new Date(departure.stop.departure || '')
                    
                    // Für Rundfahrten: Zeige die nächste Station aus der passList statt dem Endziel
                    let destination = departure.to
                    const currentStationName = selectedStation.name
                    const isRoundTrip = departure.to === currentStationName || 
                                       departure.to?.toLowerCase().includes(currentStationName.toLowerCase().split(' ')[0])
                    
                    // Wenn es eine Rundfahrt ist oder eine passList vorhanden ist, zeige die nächste Station
                    if (departure.passList && departure.passList.length > 0) {
                      // Die passList enthält alle kommenden Stationen (ohne die aktuelle)
                      // Nimm die erste Station als nächstes Ziel
                      const passList = departure.passList // Type narrowing für TypeScript
                      const nextStop = passList[0]
                      if (nextStop?.station?.name) {
                        destination = nextStop.station.name
                      }
                    }
                    
                    return (
                      <div
                        key={`past-${idx}`}
                        className={`p-3 rounded-lg border opacity-60 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            {/* Schiffsname (immer anzeigen wenn vorhanden) */}
                            {departure.shipName && (
                              <div className="flex items-center gap-1 mb-1">
                                <Ship size={12} className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                                <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {departure.shipName}
                                </span>
                              </div>
                            )}
                            <div className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {destination}
                            </div>
                          </div>
                          {departure.name && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-brandblue/30 text-white' : 'bg-brandblue/10 text-brandblue'}`}>
                              {t.course} {(departure.name || '').replace(/\b0+(\d+)/g, '$1')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {depTime.toLocaleTimeString(language === 'de' ? 'de-CH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            Abgefahren
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
