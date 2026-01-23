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
}

export default function SchedulePanel({ ships = [], selectedShipId, onShipClick, isLoading, isLiveMode = false, onToggleMode, nextDepartures = [], onReleaseNotesClick }: SchedulePanelProps) {
  const { t, language } = useI18n()
  const { theme } = useTheme()
  
  if (isLoading) {
    return (
      <div className={`w-96 shadow-xl overflow-y-auto z-20 flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-4 border-b sticky top-0 flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <Ship className="text-brandblue" size={24} />
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t.activeShips}</h2>
        </div>
        <div className="p-4 flex flex-col items-center justify-center py-12 flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brandblue mb-4"></div>
          <p className={`text-center animate-pulse ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {t.loadingSchedule}
          </p>
          <p className={`text-[10px] mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            {t.loadingSubtext}
          </p>
        </div>
        <Footer onReleaseNotesClick={onReleaseNotesClick} />
      </div>
    )
  }

  if (ships.length === 0) {
    return (
      <div className={`w-96 shadow-xl overflow-y-auto z-20 flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-4 border-b sticky top-0 flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <Ship className="text-brandblue" size={24} />
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t.activeShips}</h2>
        </div>
        <div className="p-4 flex-1">
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
                        {(dep.internalCourseNumber || dep.officialCourseNumber) && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            theme === 'dark' ? 'bg-brandblue/30 text-white' : 'bg-brandblue/10 text-brandblue'
                          }`}>
                            {t.course} {(dep.internalCourseNumber || dep.officialCourseNumber || '').toString().replace(/^0+/, '')}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs font-bold px-2 py-1 rounded ${
                        theme === 'dark' ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                      }`}>
                        {t.in} {dep.minutesUntil} {t.minutes}
                      </div>
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
        <Footer onReleaseNotesClick={onReleaseNotesClick} />
      </div>
    )
  }

  return (
    <div className={`w-96 shadow-xl overflow-y-auto z-20 flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`p-4 border-b sticky top-0 flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <Ship className="text-brandblue" size={24} />
        <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t.activeShips} ({ships.length})</h2>
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
                <p className={`text-sm mt-1 flex items-center gap-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}>
                  <Navigation size={12} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-400'} />
                  {ship.fromStation} → {ship.toStation}
                </p>
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
                      {(dep.internalCourseNumber || dep.officialCourseNumber) && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          theme === 'dark' ? 'bg-brandblue/30 text-white' : 'bg-brandblue/10 text-brandblue'
                        }`}>
                          {t.course} {(dep.internalCourseNumber || dep.officialCourseNumber || '').toString().replace(/^0+/, '')}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded ${
                      theme === 'dark' ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                    }`}>
                      {t.in} {dep.minutesUntil} {t.minutes}
                    </div>
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

      <Footer />
    </div>
  )
}
