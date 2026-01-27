'use client'

import { ShipPosition } from '@/lib/ship-position'
import { Ship, Clock, Navigation, Crown } from 'lucide-react'
import Footer from './Footer'
import { useI18n } from '@/lib/i18n-context'
import { useTheme } from '@/lib/theme'

interface NextDeparture {
  resolvedShipName: string
  from: { name: string }
  to: { name: string }
  departureTime: Date
  minutesUntil: number
  internalCourseNumber?: string
  officialCourseNumber?: string
}

interface SchedulePanelProps {
  ships?: ShipPosition[]
  selectedShipId?: string | null
  onShipClick?: (shipId: string) => void
  isLoading?: boolean
  isLiveMode?: boolean
  onToggleMode?: () => void
  nextDepartures?: NextDeparture[]
  onReleaseNotesClick?: () => void
  simulationTime?: string
  selectedDate?: string
  isMobile?: boolean
  selectedLakeId?: string
}

export default function SchedulePanel({ ships = [], selectedShipId, onShipClick, isLoading, isLiveMode = false, onToggleMode, nextDepartures = [], onReleaseNotesClick, simulationTime, selectedDate, isMobile = false, selectedLakeId }: SchedulePanelProps) {
  const { t, language } = useI18n()
  const { theme } = useTheme()
  
  // Render content based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={`p-4 flex flex-col items-center justify-center py-12 flex-1 ${isMobile ? 'pb-24' : 'pb-20'}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brandblue mb-4"></div>
          <p className={`text-center animate-pulse ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {t.loadingSchedule}
          </p>
          <p className={`text-[10px] mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            {t.loadingSubtext}
          </p>
        </div>
      )
    }

    if (ships.length === 0) {
      return (
        <div className={`p-4 flex-1 ${isMobile ? 'pb-24' : 'pb-20'}`}>
          <p className={`text-center mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {isLiveMode ? t.noActiveShipsLive : t.noActiveShipsSim}
          </p>
          
          {nextDepartures.length > 0 && (
            <div className="mt-6">
              <h3 className={`text-sm font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t.nextDepartures}:
              </h3>
              <div className="space-y-3">
                {nextDepartures.map((dep, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-lg border-2 border-transparent shadow-sm ${
                      theme === 'dark' 
                        ? 'bg-gray-700/50' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-brandblue'}`}>
                          {dep.resolvedShipName}
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded inline-block mt-1 ${
                          theme === 'dark' ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                        }`}>
                          {t.in} {dep.minutesUntil} {t.minutes}
                        </div>
                      </div>
                      {(dep.internalCourseNumber || dep.officialCourseNumber) && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          theme === 'dark' ? 'bg-brandblue/30 text-white' : 'bg-brandblue/10 text-brandblue'
                        }`}>
                          {t.course} {(dep.internalCourseNumber || dep.officialCourseNumber || '').toString().replace(/^0+/, '')}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <Navigation size={10} className="inline mr-1" />
                      {dep.from.name} → {dep.to.name}
                    </div>
                    <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Clock size={10} className="inline mr-1" />
                      {new Date(dep.departureTime).toLocaleTimeString(language === 'de' ? 'de-CH' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isLiveMode && onToggleMode && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={onToggleMode}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  theme === 'dark' 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                } shadow-md hover:shadow-lg`}
              >
                {t.switchToSimulation}
              </button>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className={`p-4 space-y-4 flex-1 ${isMobile ? 'pb-24' : 'pb-20'}`}>
        {/* Warnung bei Datum in der Zukunft */}
        {selectedDate && selectedLakeId === 'zurichsee' && (() => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const selected = new Date(selectedDate)
          selected.setHours(0, 0, 0, 0)
          const daysInFuture = Math.round((selected.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

          if (daysInFuture > 5) {
            return (
              <div className={`p-3 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-orange-900/30 border-orange-500 text-orange-300'
                  : 'bg-orange-50 border-orange-500 text-orange-700'
              }`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold mb-1">{t.shipNamesWarning}</p>
                    <p className="text-[11px] opacity-80">
                      {language === 'de'
                        ? 'Die ZSG liefert in der Regel die Daten nur für die nächsten 5 Tage.'
                        : 'ZSG typically provides data only for the next 5 days.'}
                    </p>
                  </div>
                </div>
              </div>
            )
          }
          return null
        })()}
        
        {ships.map((ship) => {
          const isAlbis = ship.name?.includes('MS Albis')
          
          // Berechne Minuten bis zur Abfahrt, wenn Schiff noch nicht in Fahrt ist
          let minutesUntilDeparture: number | null = null
          if (ship.status === 'at_station' && ship.departureTime) {
            // Verwende Simulationszeit wenn nicht im Live-Modus, sonst aktuelle Zeit
            const now = isLiveMode ? new Date() : (() => {
              if (!simulationTime || !selectedDate) return new Date()
              const [h, m] = simulationTime.split(':').map(Number)
              const d = new Date(selectedDate)
              d.setHours(h, m, 0, 0)
              return d
            })()
            
            const depTime = new Date(ship.departureTime)
            minutesUntilDeparture = Math.round((depTime.getTime() - now.getTime()) / 60000)
            // Nur anzeigen wenn positiv (in der Zukunft)
            if (minutesUntilDeparture <= 0) {
              minutesUntilDeparture = null
            }
          }
          
          return (
            <div
              key={ship.id}
              onClick={() => onShipClick?.(ship.id)}
              className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                selectedShipId === ship.id
                  ? `border-brandblue shadow-md transform scale-[1.02] ${theme === 'dark' ? 'bg-brandblue/10' : 'bg-brandblue/5'}`
                  : `border-transparent shadow-sm ${theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-700 hover:border-gray-600' : 'bg-gray-50 hover:bg-gray-100 hover:border-gray-200'}`
              }`}
            >
              <div className="mb-3">
                <div className="flex justify-between items-start">
                <h3 className={`font-bold text-lg leading-tight flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-brandblue'}`}>
                  <span className="flex-1">{ship.name || t.unknownShip}</span>
                  {isAlbis && <Crown size={20} className="text-yellow-500 fill-yellow-500 flex-shrink-0 -translate-y-0.5" />}
                </h3>
                  {(ship.internalCourseNumber || ship.courseNumber) && (
                    <span 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${theme === 'dark' ? 'bg-brandblue/30 text-white' : 'bg-brandblue/10 text-brandblue'}`}
                    >
                      {t.course} {(ship.internalCourseNumber || ship.courseNumber || '').toString().replace(/^0+/, '')}
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 flex gap-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}>
                  <Navigation size={12} className={`flex-shrink-0 mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                  <span>{ship.fromStation} → {ship.toStation}</span>
                </p>
                {minutesUntilDeparture !== null && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mt-1 ${
                    theme === 'dark' ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {t.in} {minutesUntilDeparture} {t.minutes}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className={`p-2 rounded border shadow-sm ${theme === 'dark' ? 'bg-gray-700 border-brandblue/30' : 'bg-white border-brandblue/20'}`}>
                  <div className={`flex items-center gap-1 text-[10px] mb-1 uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Clock size={10} className={theme === 'dark' ? 'text-brandblue-light' : 'text-brandblue'} />
                    {t.departure}
                  </div>
                  <p className={`font-mono font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {ship.departureTime
                      ? new Date(ship.departureTime).toLocaleTimeString(language === 'de' ? 'de-CH' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                  <p className={`text-[10px] mt-1 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {ship.fromStation || '—'}
                  </p>
                </div>

                <div className={`p-2 rounded border shadow-sm ${theme === 'dark' ? 'bg-gray-700 border-brandblue/30' : 'bg-white border-brandblue/20'}`}>
                  <div className={`flex items-center gap-1 text-[10px] mb-1 uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Clock size={10} className={theme === 'dark' ? 'text-brandblue-light' : 'text-brandblue'} />
                    {t.arrival}
                  </div>
                  <p className={`font-mono font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {ship.arrivalTime
                      ? new Date(ship.arrivalTime).toLocaleTimeString(language === 'de' ? 'de-CH' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                  <p className={`text-[10px] mt-1 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {ship.toStation || ship.nextStop || '—'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        
        {nextDepartures.length > 0 && (
          <div className={`pt-4 mt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-sm font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t.nextDepartures}:
            </h3>
            <div className="space-y-3">
              {nextDepartures.map((dep, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700/50 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-brandblue'}`}>
                        {dep.resolvedShipName}
                      </div>
                      <div className={`text-xs font-bold px-2 py-1 rounded inline-block mt-1 ${
                        theme === 'dark' ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                      }`}>
                        {t.in} {dep.minutesUntil} {t.minutes}
                      </div>
                    </div>
                    {(dep.internalCourseNumber || dep.officialCourseNumber) && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        theme === 'dark' ? 'bg-brandblue/30 text-white' : 'bg-brandblue/10 text-brandblue'
                      }`}>
                        {t.course} {(dep.internalCourseNumber || dep.officialCourseNumber || '').toString().replace(/^0+/, '')}
                      </span>
                    )}
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Navigation size={10} className="inline mr-1" />
                    {dep.from.name} → {dep.to.name}
                  </div>
                  <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Clock size={10} className="inline mr-1" />
                    {new Date(dep.departureTime).toLocaleTimeString(language === 'de' ? 'de-CH' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`${isMobile ? 'w-full' : 'w-96'} h-full shadow-xl overflow-y-auto z-20 flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`hidden lg:flex p-4 border-b sticky top-0 items-center gap-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <Ship className="text-brandblue" size={24} />
        <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {t.activeShips}{ships.length > 0 && ` (${ships.length})`}
        </h2>
      </div>

      {renderContent()}

      <div className="fixed bottom-0 left-0 right-0 lg:fixed lg:bottom-0 lg:left-auto lg:right-auto lg:w-96 mt-auto">
        <Footer onReleaseNotesClick={onReleaseNotesClick} />
      </div>
    </div>
  )
}
