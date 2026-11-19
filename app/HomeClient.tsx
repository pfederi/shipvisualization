'use client'

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { RotateCcw, Ship } from 'lucide-react'

// Types & Libs
import { ShipPosition } from '@/lib/ship-position'
import { buildDailySegments, computePositions, zurichDate } from '@/lib/positions'
import { getStationCoordinates, LAKES, loadLakeData, Station, getConnectedLakes, getCombinedLakeBounds } from '@/lib/lakes-config'
import { useI18n } from '@/lib/i18n-context'
import { useTheme } from '@/lib/theme'
import ThemeLanguageToggle from '@/components/ThemeLanguageToggle'
import Documentation from '@/components/Documentation'
import ReleaseNotes from '@/components/ReleaseNotes'

// Components
const ShipMap = dynamic(() => import('@/components/ShipMap'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-slate-100 dark:bg-gray-800 animate-pulse" />
})
const SchedulePanel = dynamic(() => import('@/components/SchedulePanel'), {
  ssr: false
})

// --- CONFIGURATION ---
const INITIAL_TIME = "13:32"
const UPDATE_INTERVAL_MS = 1000

function HomeContent() {
  const { t, language } = useI18n()
  const { theme } = useTheme()
  const searchParams = useSearchParams()
  const router = useRouter()

  // --- STATE ---
  // Initialisiere selectedLakeId aus localStorage (URL wird später geprüft)
  const [selectedLakeId, setSelectedLakeId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      // Prüfe URL-Parameter zuerst
      const params = new URLSearchParams(window.location.search)
      const urlLakeId = params.get('id')
      if (urlLakeId && LAKES[urlLakeId]) {
        return urlLakeId
      }
      return localStorage.getItem('selectedLake') || 'zurichsee'
    }
    return 'zurichsee'
  })
  const [enabledLakes, setEnabledLakes] = useState<string[]>([])

  // Prüfe URL-Parameter beim ersten Laden und bei Änderungen
  useEffect(() => {
    const urlLakeId = searchParams.get('id')
    if (urlLakeId && LAKES[urlLakeId]) {
      // URL-Parameter hat Priorität
      setSelectedLakeId(urlLakeId)
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedLake', urlLakeId)
      }
    }
  }, [searchParams]) // Prüfe bei Änderung der URL-Parameter
  const [lakeStations, setLakeStations] = useState<Station[]>([])
  const [lakeMapping, setLakeMapping] = useState<Record<string, string>>({})
  const [ships, setShips] = useState<ShipPosition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [viewMode, setViewMode] = useState<'ships' | 'station'>('ships')
  const [routeSegments, setRouteSegments] = useState<any[]>([])
  const [stationboardData, setStationboardData] = useState<Map<string, any[]>>(new Map())
  const [isDocOpen, setIsDocOpen] = useState(false)
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false)
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false)
  const [bottomBarHeight, setBottomBarHeight] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [geoJSONRoutes, setGeoJSONRoutes] = useState<any[]>([])
  const bottomBarRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [isInitialCalcDone, setIsInitialCalcDone] = useState(false)
  
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [simulationTime, setSimulationTime] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [simSpeed, setSimSpeed] = useState<number>(1)
  const [timelineValue, setTimelineValue] = useState<number>(0) // Für Live-Updates beim Ziehen
  const [isTimelineDragging, setIsTimelineDragging] = useState<boolean>(false) // Track ob Slider gerade bewegt wird

  // Lade aktivierte Seen beim Start
  useEffect(() => {
    fetch('/api/admin/enabled-lakes')
      .then(res => res.json())
      .then(data => {
        const enabled = data.enabledLakes || []
        setEnabledLakes(enabled)
        
        // Prüfe URL-Parameter beim Laden der aktivierten Seen
        const urlLakeId = searchParams.get('id')
        if (urlLakeId && LAKES[urlLakeId]) {
          // Wenn URL-Parameter vorhanden und See existiert, verwende diesen
          if (enabled.length === 0 || enabled.includes(urlLakeId)) {
            setSelectedLakeId(urlLakeId)
            if (typeof window !== 'undefined') {
              localStorage.setItem('selectedLake', urlLakeId)
            }
            return
          }
        }
        
        // Wenn der aktuell ausgewählte See nicht aktiviert ist, wähle den ersten aktivierten
        if (enabled.length > 0 && !enabled.includes(selectedLakeId)) {
          const newLakeId = enabled[0]
          setSelectedLakeId(newLakeId)
          if (typeof window !== 'undefined') {
            localStorage.setItem('selectedLake', newLakeId)
          }
        }
      })
      .catch(err => {
        console.error('Error loading enabled lakes:', err)
        // Fallback: Alle Seen aktiviert
        setEnabledLakes(Object.keys(LAKES))
      })
  }, [searchParams])

  const selectedLake = useMemo(() => LAKES[selectedLakeId], [selectedLakeId])
  
  // Für die drei verbundenen Seen: Lade alle drei
  const connectedLakeIds = useMemo(() => getConnectedLakes(selectedLakeId), [selectedLakeId])
  const combinedBounds = useMemo(() => getCombinedLakeBounds(connectedLakeIds), [connectedLakeIds])
  
  // Verfügbare Seen (nur aktivierte, alphabetisch sortiert)
  const availableLakes = useMemo(() => {
    let lakes
    if (enabledLakes.length === 0) {
      // Während des Ladens oder wenn keine aktiviert sind, zeige alle
      lakes = Object.values(LAKES)
    } else {
      lakes = Object.values(LAKES).filter(lake => enabledLakes.includes(lake.id))
    }
    // Alphabetisch nach Namen sortieren
    return lakes.sort((a, b) => a.name.localeCompare(b.name, 'de'))
  }, [enabledLakes])

  // --- REFS ---
  const baseRealTimeRef = useRef<number>(Date.now())
  const baseSimTimeRef = useRef<number>(0)
  const lastLoadedKeyRef = useRef<string>("")

  // Persist selected lake to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLake', selectedLakeId)
    }
  }, [selectedLakeId])

  // Update bottom bar and header height dynamically
  useEffect(() => {
    const updateHeights = () => {
      if (bottomBarRef.current) {
        setBottomBarHeight(bottomBarRef.current.offsetHeight)
      }
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
    }

    updateHeights()
    setTimeout(updateHeights, 100)
    setTimeout(updateHeights, 500) // Extra delay for slower devices
    window.addEventListener('resize', updateHeights)
    return () => window.removeEventListener('resize', updateHeights)
  }, [isLiveMode])

  // --- DERIVED ---
  const isDateOutOfRange = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    const target = new Date(selectedDate); target.setHours(0,0,0,0)
    return (target.getTime() - today.getTime()) > (5 * 24 * 60 * 60 * 1000)
  }, [selectedDate])

  const timeRange = useMemo(() => {
    if (routeSegments.length === 0) return { min: 480, max: 1200 }
    let min = 1440, max = 0
    routeSegments.forEach(({ segment }) => {
      const dep = new Date(segment.departureTime)
      const arr = new Date(segment.arrivalTime)
      min = Math.min(min, dep.getHours() * 60 + dep.getMinutes())
      max = Math.max(max, arr.getHours() * 60 + arr.getMinutes())
    })
    return { min: Math.max(0, min - 15), max: Math.min(1439, max + 15) }
  }, [routeSegments])

  // --- HELPERS ---
  const resetTimeBasis = useCallback((newSimTimeMs: number) => {
    baseRealTimeRef.current = Date.now()
    baseSimTimeRef.current = newSimTimeMs
  }, [])

  const minutesToTimeString = useCallback((totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }, [])

  const timeStringToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  const loadDailySchedule = useCallback(async (targetDate: Date, force = false) => {
    const dateStr = zurichDate(targetDate)
    const modeKey = isLiveMode ? 'live' : 'sim'
    const currentKey = `${dateStr}-${modeKey}${force ? '-force' : ''}`
    
    if (lastLoadedKeyRef.current === currentKey) return
    lastLoadedKeyRef.current = currentKey

    try {
      setIsLoading(true)
      
      // Lade Stationsdaten für alle verbundenen Seen
      const allStationsPromises = connectedLakeIds.map(lakeId => loadLakeData(lakeId))
      const allLakeData = await Promise.all(allStationsPromises)
      
      // Kombiniere alle Stationen und Mappings
      const combinedStations: Station[] = []
      const combinedMapping: Record<string, string> = {}
      allLakeData.forEach(({ stations, mapping }) => {
        combinedStations.push(...stations)
        Object.assign(combinedMapping, mapping)
      })
      
      setLakeStations(combinedStations)
      setLakeMapping(combinedMapping)

      const [
        { getCachedGeoJSONRoutes },
        { getShipNameByCourseNumber, getCachedShipData },
        { getAllStationsStationboard }
      ] = await Promise.all([
        import('@/lib/geojson-routes'),
        import('@/lib/ship-names-api'),
        import('@/lib/transport-api')
      ])

      if (selectedLake.hasShipNames) {
        await getCachedShipData().catch(() => {})
      }
      const stationNames = combinedStations.map(s => s.uic_ref || s.name)
      const stationCoords = getStationCoordinates(combinedStations)
      
      console.log(`🗺️ Station-Koordinaten erstellt: ${stationCoords.size} Einträge`)
      const coordEntries = Array.from(stationCoords.entries()).slice(0, 5)
      console.log(`📍 Erste 5 Stationen:`)
      coordEntries.forEach(([key, coords]) => {
        console.log(`   ${key}: (${coords.lat}, ${coords.lon})`)
      })
      
      // Lade GeoJSON-Routen für alle verbundenen Seen
      const geoRoutesPromises = connectedLakeIds.map(lakeId => 
        getCachedGeoJSONRoutes(LAKES[lakeId].geojsonPath)
      )
      const allGeoRoutes = await Promise.all(geoRoutesPromises)
      const geoRoutes = allGeoRoutes.flat() // Kombiniere alle Routen
      
      const [stationboardMap] = await Promise.all([
        getAllStationsStationboard(stationNames, dateStr, "00:00", force)
      ])
      
      const totalEntries = Array.from(stationboardMap.values()).reduce((sum, arr) => sum + arr.length, 0)
      const lakeNames = connectedLakeIds.map(id => LAKES[id].name).join(', ')
      console.log(`📡 Stationboard geladen für ${lakeNames}: ${stationboardMap.size} Stationen, ${totalEntries} Einträge`)
      
      // Speichere Stationboard-Daten für Station-Ansicht
      setStationboardData(stationboardMap)
      
      const finalSegments = await buildDailySegments({
        stationboards: stationboardMap,
        mapping: combinedMapping,
        stationCoords,
        geoRoutes,
        lakeId: selectedLakeId,
        shipNameFor: (course) => (selectedLake.hasShipNames ? getShipNameByCourseNumber(course, targetDate) : Promise.resolve(null)),
      })
      
      setRouteSegments(finalSegments)
      setGeoJSONRoutes(geoRoutes)
      setIsInitialCalcDone(false) // Trigger neue initiale Berechnung
      setIsLoading(false)
    } catch (error) {
      console.error('Load failed:', error)
      setIsLoading(false)
    }
  }, [isLiveMode, selectedLakeId, selectedLake.geojsonPath, selectedLake.name, selectedLake.hasShipNames, connectedLakeIds])

  // --- INITIALIZATION ---
  useEffect(() => {
    const now = new Date()
    baseSimTimeRef.current = now.getTime()
    baseRealTimeRef.current = Date.now()
    // Initialisiere Timeline-Value nur einmal beim Start
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    setTimelineValue(currentMinutes)
    loadDailySchedule(now)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDailySchedule])

  // --- LAKE CHANGE: Force reload when lake changes ---
  useEffect(() => {
    if (selectedLakeId) {
      const currentDate = isLiveMode ? new Date() : new Date(selectedDate)
      loadDailySchedule(currentDate, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLakeId])

  // --- ACTIONS ---
  const handleTimeChange = (newTimeStr: string) => {
    setSimulationTime(newTimeStr)
    const [h, m] = newTimeStr.split(':').map(Number)
    const d = new Date(selectedDate)
    d.setHours(h, m, 0, 0)
    resetTimeBasis(d.getTime())
    loadDailySchedule(d)
  }


  const handleTimelineChange = (minutes: number) => {
    // Finales Update beim Loslassen - Simulation läuft ab gewählter Zeit weiter
    const newTimeStr = minutesToTimeString(minutes)
    setTimelineValue(minutes)
    const [h, m] = newTimeStr.split(':').map(Number)
    const d = new Date(selectedDate)
    d.setHours(h, m, 0, 0)
    const targetTimeMs = d.getTime()
    const currentRealTimeMs = Date.now()
    
    // 1. Zeitbasis auf die neue gewählte Zeit setzen
    baseSimTimeRef.current = targetTimeMs
    baseRealTimeRef.current = currentRealTimeMs
    
    // 2. State-Updates
    setSimulationTime(newTimeStr)
    setIsTimelineDragging(false)
    
    // 3. Sofortige Positionsberechnung triggern
    updatePositions(d)
  }

  const handleDateChange = (newDateStr: string) => {
    setSelectedDate(newDateStr)
    const [h, m] = simulationTime.split(':').map(Number)
    const d = new Date(newDateStr)
    d.setHours(h, m, 0, 0)
    resetTimeBasis(d.getTime())
    loadDailySchedule(d)
  }

  const toggleMode = () => {
    const now = new Date()
    resetTimeBasis(isLiveMode ? now.getTime() : Date.now())
    if (isLiveMode) {
      // Beim Wechsel zur Simulation Zeit auf 13:32 setzen
      setSimulationTime(INITIAL_TIME)
      const [h, m] = INITIAL_TIME.split(':').map(Number)
      const d = new Date(selectedDate)
      d.setHours(h, m, 0, 0)
      resetTimeBasis(d.getTime())
      loadDailySchedule(d)
    } else {
      loadDailySchedule(now)
    }
    setIsLiveMode(!isLiveMode)
  }

  const handleReset = () => {
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
    setSimulationTime(INITIAL_TIME)
    setSimSpeed(1)
    setIsLiveMode(false)
    const [h, m] = INITIAL_TIME.split(':').map(Number)
    const d = new Date(today); d.setHours(h, m, 0, 0)
    resetTimeBasis(d.getTime())
    loadDailySchedule(d)
  }

  // --- POSITION CALCULATION ---
  const updatePositions = useCallback(async (overrideTime?: Date) => {
    if (routeSegments.length === 0 || geoJSONRoutes.length === 0) return

    let now: Date
    if (overrideTime) {
      now = overrideTime
    } else if (isLiveMode) {
      now = new Date()
    } else {
      const elapsed = Date.now() - baseRealTimeRef.current
      now = new Date(baseSimTimeRef.current + elapsed * simSpeed)
    }
    
    const nowTime = now.getTime()
    
    if (!isLiveMode && !overrideTime && !isTimelineDragging) {
      const t = now.toTimeString().slice(0, 5)
      if (t !== simulationTime) setSimulationTime(t)
    }

    // Berechne alle Positionen parallel für maximale Performance
    const finalShips = await computePositions(routeSegments, geoJSONRoutes, now)
    
    // Logge nur wenn sich etwas Relevantes ändert oder alle X Sekunden
    const shipsString = finalShips.map(s => `${s.name} (${s.status})`).sort().join(', ')
    const hasChanged = finalShips.length !== ships.length || 
                      finalShips.some((s, i) => s.name !== ships[i]?.name || s.status !== ships[i]?.status)

    if (hasChanged || !isInitialCalcDone) {
      console.log(`\n🚢 Aktive Schiffe (${finalShips.length}):`)
      finalShips.forEach(s => {
        const depStr = s.departureTime ? new Date(s.departureTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '?'
        const arrStr = s.arrivalTime ? new Date(s.arrivalTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '?'
        console.log(`   ${s.name} (${s.status}): ${s.fromStation} → ${s.toStation} (${depStr} - ${arrStr})`)
      })
    }

    setShips(finalShips)
    setIsInitialCalcDone(true)
  }, [routeSegments, geoJSONRoutes, isLiveMode, simSpeed, simulationTime, baseSimTimeRef, baseRealTimeRef, isTimelineDragging, ships, isInitialCalcDone])

  // Timeline drag handler - nur visuelle Updates während des Ziehens (keine teuren Berechnungen)
  const handleTimelineDrag = useCallback((minutes: number) => {
    setIsTimelineDragging(true)
    const newTimeStr = minutesToTimeString(minutes)
    // Nur visuelle Updates während des Ziehens - keine Positionsberechnung
    setTimelineValue(minutes)
    setSimulationTime(newTimeStr)
  }, [minutesToTimeString])

  // Initial Calculation Trigger
  useEffect(() => {
    if (!isInitialCalcDone && routeSegments.length > 0) {
      updatePositions()
    }
  }, [isInitialCalcDone, routeSegments, updatePositions])

  // --- POSITION LOOP ---
  useEffect(() => {
    const timer = setInterval(updatePositions, UPDATE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [updatePositions])

  // Berechne die nächsten 3 Abfahrten
  const nextDepartures = useMemo(() => {
    if (routeSegments.length === 0) return []
    
    const now = isLiveMode ? new Date() : (() => {
      const [h, m] = simulationTime.split(':').map(Number)
      const d = new Date(selectedDate)
      d.setHours(h, m, 0, 0)
      return d
    })()
    
    // Erstelle ein Set von aktiven Schiff-IDs (Name + Kursnummer)
    const activeShipIds = new Set(
      ships.map(ship => {
        const courseNum = ship.internalCourseNumber || ship.courseNumber || ''
        return `${ship.name}|${courseNum}`
      })
    )
    
    const upcoming = routeSegments
      .map(seg => ({
        ...seg.segment,
        minutesUntil: Math.round((new Date(seg.segment.departureTime).getTime() - now.getTime()) / 60000)
      }))
      .filter(seg => {
        // Nur zukünftige Abfahrten
        if (seg.minutesUntil <= 0) return false
        
        // Filtere Abfahrten heraus, die bereits bei den aktiven Schiffen sind
        const courseNum = seg.internalCourseNumber || seg.officialCourseNumber || ''
        const segmentId = `${seg.resolvedShipName}|${courseNum}`
        return !activeShipIds.has(segmentId)
      })
      .sort((a, b) => a.minutesUntil - b.minutesUntil)
      .slice(0, 3)
    
    return upcoming
  }, [routeSegments, isLiveMode, simulationTime, selectedDate, ships])

  return (
    <>
      <main className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-gray-900 overflow-hidden" style={{ height: '100svh' }}>
        {/* Desktop Header */}
        <header className="hidden lg:flex bg-brandblue text-white px-4 shadow-lg z-10 border-b border-brandblue-dark h-[72px] items-center">
          <div className="flex justify-between items-center w-full gap-8">
            <div className="flex justify-start items-center gap-8">
              <h1 className="text-xl font-black tracking-tight uppercase whitespace-nowrap">{t.title}</h1>
              
              <div className="flex items-center bg-black/10 rounded-xl p-1 gap-1 border border-white/10 h-[52px]">
                <button onClick={toggleMode} className={`px-4 h-full rounded-lg text-xs font-black transition-all flex items-center gap-2 ${isLiveMode ? 'bg-green-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-white animate-pulse' : 'bg-white/20'}`} /> {t.liveMode}
                </button>
                <button onClick={() => isLiveMode && toggleMode()} className={`px-4 h-full rounded-lg text-xs font-black transition-all ${!isLiveMode ? 'bg-orange-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
                  {t.simulationMode}
                </button>
              {!isLiveMode && (
                <div className="flex items-center gap-5 px-4 border-l border-white/10 ml-1 h-full">
                  <div className="flex flex-col min-w-[140px] justify-center">
                    <span className="text-[9px] uppercase font-black text-white/80 mb-1">Timeline</span>
                    <input 
                      type="range" 
                      min={timeRange.min} 
                      max={timeRange.max} 
                      value={timelineValue || timeStringToMinutes(simulationTime)} 
                      onInput={(e) => handleTimelineDrag(parseInt((e.target as HTMLInputElement).value))}
                      onChange={(e) => handleTimelineChange(parseInt(e.target.value))} 
                      className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white" 
                    />
                  </div>
                  <div className="flex items-center h-full">
                    <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="bg-white/10 rounded-md px-2 py-1.5 text-xs font-bold border-none focus:ring-1 focus:ring-white/30 cursor-pointer text-white" />
                  </div>
                  <div className="flex items-center h-full">
                    <input type="time" value={simulationTime} onChange={(e) => handleTimeChange(e.target.value)} className="bg-white/10 rounded-md px-2 py-1.5 text-xs font-bold border-none focus:ring-1 focus:ring-white/30 cursor-pointer text-white" />
                  </div>
                  <div className="flex gap-1 bg-black/20 p-1 rounded-lg h-8 items-center">
                    {[1, 2, 4, 10, 100].map(s => (
                      <button 
                        key={s} 
                        onClick={() => setSimSpeed(s)} 
                        className={`${s === 100 ? 'w-9' : 'w-7'} h-6 flex items-center justify-center rounded text-[9px] font-black transition-all ${simSpeed === s ? 'bg-white text-brandblue shadow-md' : 'text-white/80 hover:text-white'}`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                  <button onClick={handleReset} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors" title={t.reset}>
                    <RotateCcw size={16} strokeWidth={3} />
                  </button>
                </div>
              )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDocOpen(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 border border-white/10 cursor-pointer"
                title={t.documentation}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                {t.documentation}
              </button>
              <button
                onClick={() => loadDailySchedule(new Date(selectedDate), true)}
                disabled={isLoading}
                className={`px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-md text-[10px] font-black uppercase transition-all flex items-center gap-2 border border-white/10 ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                title={isLiveMode ? 'Daten frisch vom Server laden' : `Fahrplan neu laden`}
              >
                <RotateCcw size={12} strokeWidth={3} className={isLoading ? 'animate-spin' : ''} />
                {isLoading ? 'Lädt...' : 'Aktualisieren'}
              </button>
              <ThemeLanguageToggle />
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header ref={headerRef} className="lg:hidden bg-brandblue text-white px-3 py-2 shadow-lg z-10 border-b border-brandblue-dark" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
          <div className="flex justify-between items-center">
            <h1 className="text-xs font-black tracking-tight uppercase opacity-60 line-clamp-1">{t.title}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDocOpen(true)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-all"
                title={t.documentation}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </button>
              <button
                onClick={() => loadDailySchedule(new Date(selectedDate), true)}
                disabled={isLoading}
                className={`p-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-md transition-all ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <RotateCcw size={16} strokeWidth={3} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <ThemeLanguageToggle />
            </div>
          </div>
        </header>

      <div className="flex-1 flex overflow-hidden relative lg:flex-row">
          <div 
            className="flex-1 lg:h-full overflow-hidden"
            style={{
              height: bottomBarHeight > 0 && headerHeight > 0
                ? `calc(100svh - ${bottomBarHeight}px - ${headerHeight}px)`
                : undefined
            }}
          >
            <ShipMap 
              ships={ships} 
              onShipClick={(ship) => {
                setSelectedShipId(ship.id)
                setViewMode('ships')
                setSelectedStation(null)
              }} 
              onStationClick={(station) => {
                setSelectedStation(station)
                setViewMode('station')
                setSelectedShipId(null)
              }}
              selectedShipId={selectedShipId} 
              selectedLakeId={selectedLakeId} 
              stations={lakeStations}
              availableLakes={availableLakes}
              onLakeChange={(newLakeId) => {
                setSelectedLakeId(newLakeId)
                // Aktualisiere URL-Parameter
                const params = new URLSearchParams(searchParams.toString())
                params.set('id', newLakeId)
                router.push(`?${params.toString()}`, { scroll: false })
                setShips([])
                setRouteSegments([])
                setLakeStations([])
                setLakeMapping({})
                setIsInitialCalcDone(false)
                lastLoadedKeyRef.current = "" // Force reload by clearing cache key
                setViewMode('ships') // Zurück zu aktiven Schiffen
                setSelectedStation(null)
                setSelectedShipId(null)
                if (typeof window !== 'undefined') {
                  localStorage.setItem('selectedLake', newLakeId)
                }
              }}
            />
          </div>

          {/* Mobile Loading Indicator */}
          {isLoading && (
            <div className="lg:hidden fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 flex flex-col items-center gap-3" style={{ zIndex: 10000 }}>
              <div className={`animate-spin rounded-full h-12 w-12 border-b-4 ${theme === 'dark' ? 'border-white' : 'border-brandblue'}`}></div>
              <p className={`text-sm font-bold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t.loadingSchedule}
              </p>
              <p className={`text-xs text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.loadingSubtext}
              </p>
            </div>
          )}

          {/* Mobile Panel Toggle Button */}
          <button
            onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
            className={`lg:hidden fixed ${isLiveMode ? 'bottom-[80px]' : 'bottom-[260px]'} right-4 bg-brandblue text-white p-3 rounded-full shadow-xl transition-all ${isMobilePanelOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            style={{ zIndex: 9999 }}
          >
            <Ship size={24} />
          </button>

          {/* Desktop Schedule Panel */}
          <div className="hidden lg:block">
            <SchedulePanel
            ships={ships}
            selectedShipId={selectedShipId}
            onShipClick={setSelectedShipId}
            selectedStation={selectedStation}
            viewMode={viewMode}
            onBackToShips={() => {
              setViewMode('ships')
              setSelectedStation(null)
            }}
            routeSegments={routeSegments}
            stationboardData={stationboardData}
            isLoading={isLoading || (routeSegments.length > 0 && !isInitialCalcDone)}
            isLiveMode={isLiveMode}
            onToggleMode={toggleMode}
            nextDepartures={nextDepartures}
            onReleaseNotesClick={() => setIsReleaseNotesOpen(true)}
            simulationTime={simulationTime}
            selectedDate={selectedDate}
            selectedLakeId={selectedLakeId}
          />
          </div>

          {/* Mobile Sliding Panel */}
          <div className={`lg:hidden fixed inset-0 w-full bg-white dark:bg-gray-800 shadow-2xl transition-transform duration-300 ${isMobilePanelOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ zIndex: 9998 }}>
            {/* Panel Header */}
            <div className="bg-brandblue text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ship size={20} />
                <h2 className="font-bold text-lg">{t.activeShips} ({ships.length})</h2>
              </div>
              <button
                onClick={() => setIsMobilePanelOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Panel Content */}
            <div className="h-[calc(100svh-64px)] overflow-hidden">
              <SchedulePanel
                ships={ships}
                selectedShipId={selectedShipId}
                onShipClick={(id) => {
                  setSelectedShipId(id)
                  setViewMode('ships')
                  setSelectedStation(null)
                  setIsMobilePanelOpen(false)
                }}
                selectedStation={selectedStation}
                viewMode={viewMode}
                onBackToShips={() => {
                  setViewMode('ships')
                  setSelectedStation(null)
                }}
                routeSegments={routeSegments}
                stationboardData={stationboardData}
                isLoading={isLoading || (routeSegments.length > 0 && !isInitialCalcDone)}
                isLiveMode={isLiveMode}
                onToggleMode={toggleMode}
                nextDepartures={nextDepartures}
                onReleaseNotesClick={() => setIsReleaseNotesOpen(true)}
                simulationTime={simulationTime}
                selectedDate={selectedDate}
                isMobile={true}
                selectedLakeId={selectedLakeId}
              />
            </div>
          </div>

          {/* Mobile Panel Overlay */}
          {isMobilePanelOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50"
              style={{ zIndex: 9997 }}
              onClick={() => setIsMobilePanelOpen(false)}
            />
          )}

          {/* Mobile Bottom Bar */}
          <div ref={bottomBarRef} className="lg:hidden fixed bottom-0 left-0 right-0 bg-brandblue text-white z-20 border-t border-brandblue-dark" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {/* Live/Simulation Toggle */}
            <div className="flex items-center justify-center p-2 gap-1">
              <button 
                onClick={toggleMode} 
                className={`flex-1 py-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${isLiveMode ? 'bg-green-500 text-white shadow-lg' : 'bg-white/10 text-white/60'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-white animate-pulse' : 'bg-white/20'}`} />
                {t.liveMode}
              </button>
              <button 
                onClick={() => isLiveMode && toggleMode()} 
                className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${!isLiveMode ? 'bg-orange-500 text-white shadow-lg' : 'bg-white/10 text-white/60'}`}
              >
                {t.simulationMode}
              </button>
            </div>

            {/* Simulation Controls */}
            {!isLiveMode && (
              <div className="border-t border-white/10 p-3 space-y-3">
                {/* Timeline Label */}
                <span className="text-[9px] uppercase font-black text-white/80">Timeline</span>
                
                {/* Date and Time */}
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => handleDateChange(e.target.value)} 
                    className="flex-1 bg-white/10 rounded-md px-2 py-1.5 text-xs font-bold border-none text-white"
                  />
                  <input 
                    type="time" 
                    value={simulationTime} 
                    onChange={(e) => handleTimeChange(e.target.value)} 
                    className="flex-1 bg-white/10 rounded-md px-2 py-1.5 text-xs font-bold border-none text-white"
                  />
                </div>

                {/* Timeline Slider */}
                <div>
                  <input 
                    type="range" 
                    min={timeRange.min} 
                    max={timeRange.max} 
                    value={timelineValue || timeStringToMinutes(simulationTime)} 
                    onInput={(e) => handleTimelineDrag(parseInt((e.target as HTMLInputElement).value))}
                    onChange={(e) => handleTimelineChange(parseInt(e.target.value))} 
                    className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                  />
                </div>

                {/* Speed Controls and Reset */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 bg-black/20 p-1 rounded-lg flex-1">
                    {[1, 2, 4, 10, 100].map(s => (
                      <button 
                        key={s} 
                        onClick={() => setSimSpeed(s)} 
                        className={`flex-1 py-2 rounded text-[10px] font-black transition-all ${simSpeed === s ? 'bg-white text-brandblue shadow-md' : 'text-white/80'}`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleReset} 
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors" 
                    title={t.reset}
                  >
                    <RotateCcw size={18} strokeWidth={3} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Documentation isOpen={isDocOpen} onClose={() => setIsDocOpen(false)} />
      <ReleaseNotes isOpen={isReleaseNotesOpen} onClose={() => setIsReleaseNotesOpen(false)} />
    </>
  )
}

export default function HomeClient() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Lädt...</div>}>
      <HomeContent />
    </Suspense>
  )
}
