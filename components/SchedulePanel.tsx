'use client'

import { ShipPosition } from '@/lib/ship-position'
import { Ship, ArrowLeft, Anchor } from 'lucide-react'
import Footer from './Footer'
import { useI18n } from '@/lib/i18n-context'
import { useTheme } from '@/lib/theme'
import { Station } from '@/lib/lakes-config'
import StationView from './StationView'
import ShipsView from './ShipsView'

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
  selectedStation?: Station | null
  viewMode?: 'ships' | 'station'
  onBackToShips?: () => void
  routeSegments?: any[]
  stationboardData?: Map<string, any[]>
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

export default function SchedulePanel({ 
  ships = [], 
  selectedShipId, 
  onShipClick, 
  selectedStation, 
  viewMode = 'ships', 
  onBackToShips, 
  isLoading, 
  isLiveMode = false, 
  onToggleMode, 
  nextDepartures = [], 
  onReleaseNotesClick, 
  simulationTime, 
  selectedDate, 
  isMobile = false, 
  selectedLakeId 
}: SchedulePanelProps) {
  const { t } = useI18n()
  const { theme } = useTheme()

  // Render content based on state
  const renderContent = () => {
    if (viewMode === 'station' && selectedStation) {
      return (
        <StationView
          selectedStation={selectedStation}
          selectedDate={selectedDate}
          selectedLakeId={selectedLakeId}
          isLiveMode={isLiveMode}
          simulationTime={simulationTime}
          isMobile={isMobile}
        />
      )
    }

    return (
      <ShipsView
        ships={ships}
        selectedShipId={selectedShipId}
        onShipClick={onShipClick}
        isLoading={isLoading}
        isLiveMode={isLiveMode}
        onToggleMode={onToggleMode}
        nextDepartures={nextDepartures}
        simulationTime={simulationTime}
        selectedDate={selectedDate}
        isMobile={isMobile}
      />
    )
  }

  return (
    <div className={`${isMobile ? 'w-full' : 'w-96'} h-full shadow-xl overflow-y-auto z-20 flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`hidden lg:flex flex-col sticky top-0 z-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Hauptheader */}
        <div className={`p-4 border-b flex items-center gap-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {viewMode === 'station' && selectedStation ? (
            <Anchor className="text-brandblue" size={24} />
          ) : (
            <Ship className="text-brandblue" size={24} />
          )}
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {viewMode === 'station' && selectedStation 
              ? selectedStation.name
              : `${t.activeShips}${ships.length > 0 ? ` (${ships.length})` : ''}`
            }
          </h2>
        </div>
        
        {/* Zurück-Button (nur in Stationsansicht) */}
        {viewMode === 'station' && selectedStation && (
          <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={onBackToShips}
              className="flex items-center gap-2 text-brandblue hover:text-brandblue/80 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-semibold">Zurück zu aktiven Schiffen</span>
            </button>
          </div>
        )}
      </div>

      {renderContent()}

      <div className="fixed bottom-0 left-0 right-0 lg:fixed lg:bottom-0 lg:left-auto lg:right-auto lg:w-96 mt-auto">
        <Footer onReleaseNotesClick={onReleaseNotesClick} />
      </div>
    </div>
  )
}
