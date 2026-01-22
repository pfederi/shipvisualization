'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { RotateCcw } from 'lucide-react'

// Types & Libs
import { ShipPosition, calculateShipPosition } from '@/lib/ship-position'
import { getStationCoordinates, normalizeStationName, ZURICHSEE_STATIONS } from '@/lib/zurichsee-stations'

// Components
const ShipMap = dynamic(() => import('@/components/ShipMap'), { 
  ssr: false,
  loading: () => <div className="flex-1 bg-slate-100 animate-pulse" /> 
})
const SchedulePanel = dynamic(() => import('@/components/SchedulePanel'), { 
  ssr: false 
})

// --- CONFIGURATION ---
const INITIAL_TIME = "13:32"
const UPDATE_INTERVAL_MS = 1000
const PRE_DEPARTURE_DWELL_MS = 15 * 60 * 1000 
const POST_ARRIVAL_GRACE_MS = 10 * 60 * 1000  

export default function Home() {
  // --- STATE ---
  const [ships, setShips] = useState<ShipPosition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null)
  const [routeSegments, setRouteSegments] = useState<any[]>([])
  const [geoJSONRoutes, setGeoJSONRoutes] = useState<any[]>([])
  const [isInitialCalcDone, setIsInitialCalcDone] = useState(false)
  
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [simulationTime, setSimulationTime] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [simSpeed, setSimSpeed] = useState<number>(1)

  // --- REFS ---
  const baseRealTimeRef = useRef<number>(Date.now())
  const baseSimTimeRef = useRef<number>(0)
  const lastLoadedKeyRef = useRef<string>("")

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

  const minutesToTimeString = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const timeStringToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  // --- DATA LOADING ---
  const loadDailySchedule = useCallback(async (targetDate: Date) => {
    const dateStr = targetDate.toISOString().split('T')[0]
    const modeKey = isLiveMode ? 'live' : 'sim'
    const currentKey = `${dateStr}-${modeKey}`
    
    if (lastLoadedKeyRef.current === currentKey) return
    lastLoadedKeyRef.current = currentKey

    try {
      setIsLoading(true)
      const [
        { getCachedGeoJSONRoutes },
        { createRouteSegmentFromStationboard },
        { getShipNameByCourseNumber, getCachedShipData },
        { getAllStationsStationboard }
      ] = await Promise.all([
        import('@/lib/geojson-routes'),
        import('@/lib/ship-position'),
        import('@/lib/ship-names-api'),
        import('@/lib/transport-api')
      ])

      await getCachedShipData().catch(() => {})
      const stationNames = ZURICHSEE_STATIONS.map(s => s.name)
      const stationCoords = getStationCoordinates()
      
      const [stationboardMap, geoRoutes] = await Promise.all([
        getAllStationsStationboard(stationNames, dateStr, "00:00"),
        getCachedGeoJSONRoutes()
      ])
      
      const processedSegments: any[] = []
      for (const [_, entries] of stationboardMap.entries()) {
        for (const entry of entries) {
          if (!entry.name || !entry.passList || entry.passList.length < 2) continue
          const internalNum = entry.name.match(/\d+/)?.[0] || "0"
          const officialNum = entry.number || internalNum
          const shipName = await getShipNameByCourseNumber(internalNum, targetDate)
          const displayName = shipName || `Schiff (Kurs ${internalNum})`

          for (let i = 0; i < entry.passList.length - 1; i++) {
            const from = entry.passList[i], to = entry.passList[i+1]
            if (!from.station?.name || !to.station?.name || !from.departure || !to.arrival) continue
            const depTime = new Date(from.departure), arrTime = new Date(to.arrival)
            if (isNaN(depTime.getTime())) continue

            const segment = createRouteSegmentFromStationboard(
              normalizeStationName(from.station.name), normalizeStationName(to.station.name),
              depTime, officialNum, stationCoords, geoRoutes, arrTime, internalNum
            )

            if (segment) {
              processedSegments.push({
                segment: {
                  ...segment,
                  arrivalAtFromStation: from.arrival ? new Date(from.arrival) : new Date(depTime.getTime() - PRE_DEPARTURE_DWELL_MS),
                  resolvedShipName: displayName, internalCourseNumber: internalNum, officialCourseNumber: officialNum
                }
              })
            }
          }
        }
      }

      const uniqueMap = new Map()
      processedSegments.forEach(s => {
        const key = `${s.segment.internalCourseNumber}|${s.segment.from.name}|${s.segment.to.name}|${s.segment.departureTime.getTime()}`
        uniqueMap.set(key, s)
      })
      
      setRouteSegments(Array.from(uniqueMap.values()))
      setGeoJSONRoutes(geoRoutes)
      setIsInitialCalcDone(false) // Trigger neue initiale Berechnung
      setIsLoading(false)
    } catch (error) {
      console.error('Load failed:', error)
      setIsLoading(false)
    }
  }, [isLiveMode])

  // --- INITIALIZATION ---
  useEffect(() => {
    const now = new Date()
    baseSimTimeRef.current = now.getTime()
    baseRealTimeRef.current = Date.now()
    loadDailySchedule(now)
  }, [loadDailySchedule])

  // --- ACTIONS ---
  const handleTimeChange = (newTimeStr: string) => {
    setSimulationTime(newTimeStr)
    const [h, m] = newTimeStr.split(':').map(Number)
    const d = new Date(selectedDate)
    d.setHours(h, m, 0, 0)
    resetTimeBasis(d.getTime())
    loadDailySchedule(d)
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
    if (isLiveMode) setSimulationTime(now.toTimeString().slice(0, 5))
    setIsLiveMode(!isLiveMode)
    loadDailySchedule(now)
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
  const updatePositions = useCallback(async () => {
    if (routeSegments.length === 0 || geoJSONRoutes.length === 0) return

    const elapsed = Date.now() - baseRealTimeRef.current
    const now = isLiveMode ? new Date() : new Date(baseSimTimeRef.current + elapsed * simSpeed)
    
    if (!isLiveMode) {
      const t = now.toTimeString().slice(0, 5)
      if (t !== simulationTime) setSimulationTime(t)
    }

    const activePositions: ShipPosition[] = []
    for (const { segment } of routeSegments) {
      const { from, to, departureTime, arrivalTime, arrivalAtFromStation, resolvedShipName, internalCourseNumber, officialCourseNumber } = segment
      const shipId = `ship-${internalCourseNumber}-${departureTime.getTime()}`

      if (arrivalAtFromStation && now >= arrivalAtFromStation && now < departureTime) {
        activePositions.push({
          id: shipId, name: resolvedShipName, latitude: from.lat, longitude: from.lon,
          course: 0, speed: 0, nextStop: to.name, status: 'at_station',
          departureTime, arrivalTime, fromStation: from.name, toStation: to.name,
          internalCourseNumber, officialCourseNumber
        } as any)
      } else if (now >= departureTime && now <= arrivalTime) {
        const pos = await calculateShipPosition([segment], now, geoJSONRoutes)
        if (pos) {
          Object.assign(pos, { id: shipId, name: resolvedShipName, status: 'driving', internalCourseNumber, officialCourseNumber })
          activePositions.push(pos)
        }
      } else if (now > arrivalTime && now.getTime() < arrivalTime.getTime() + POST_ARRIVAL_GRACE_MS) {
        activePositions.push({
          id: shipId, name: resolvedShipName, latitude: to.lat, longitude: to.lon,
          course: 0, speed: 0, nextStop: 'Angekommen', status: 'at_station',
          departureTime, arrivalTime, fromStation: from.name, toStation: to.name,
          internalCourseNumber, officialCourseNumber
        } as any)
      }
    }

    const finalMap = new Map<string, ShipPosition>()
    activePositions.forEach(p => {
      const key = p.internalCourseNumber || p.name
      const existing = finalMap.get(key)
      if (!existing || (p.status === 'driving' && existing.status === 'at_station')) finalMap.set(key, p)
    })
    setShips(Array.from(finalMap.values()))
    setIsInitialCalcDone(true)
  }, [routeSegments, geoJSONRoutes, isLiveMode, simSpeed, simulationTime, baseSimTimeRef, baseRealTimeRef])

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

  return (
    <main className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
      <header className="bg-brandblue text-white px-4 shadow-lg z-10 border-b border-brandblue-dark h-[72px] flex items-center">
        <div className="flex justify-start items-center w-full gap-8">
          <h1 className="text-xl font-black tracking-tight uppercase whitespace-nowrap">Zürichsee Schiffstracker</h1>
          <div className="flex items-center bg-black/10 rounded-xl p-1 gap-1 border border-white/10 h-[52px]">
            <button onClick={toggleMode} className={`px-4 h-full rounded-lg text-xs font-black transition-all flex items-center gap-2 ${isLiveMode ? 'bg-green-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-white animate-pulse' : 'bg-white/20'}`} /> LIVE
            </button>
            <button onClick={() => isLiveMode && toggleMode()} className={`px-4 h-full rounded-lg text-xs font-black transition-all ${!isLiveMode ? 'bg-orange-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
              SIMULATION
            </button>
            {!isLiveMode && (
              <div className="flex items-center gap-5 px-4 border-l border-white/10 ml-1 h-full">
                <div className="flex flex-col min-w-[140px] justify-center">
                  <span className="text-[9px] uppercase font-black text-white/80 mb-1">Timeline</span>
                  <input type="range" min={timeRange.min} max={timeRange.max} value={timeStringToMinutes(simulationTime)} onChange={(e) => handleTimeChange(minutesToTimeString(parseInt(e.target.value)))} className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white" />
                </div>
                <div className="relative group flex items-center h-full">
                  <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className={`bg-white/10 rounded-md px-2 py-1.5 text-xs font-bold border-none focus:ring-1 focus:ring-white/30 cursor-pointer ${isDateOutOfRange ? 'text-orange-300' : 'text-white'}`} />
                  {isDateOutOfRange && <div className="absolute top-full left-0 mt-2 w-48 bg-orange-600 text-white text-[10px] p-2 rounded shadow-2xl z-[100] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">⚠️ Schiffsnamen erst kurzfristig verfügbar.</div>}
                </div>
                <div className="flex items-center h-full">
                  <input type="time" value={simulationTime} onChange={(e) => handleTimeChange(e.target.value)} className="bg-white/10 rounded-md px-2 py-1.5 text-xs font-bold border-none focus:ring-1 focus:ring-white/30 cursor-pointer text-white" />
                </div>
                <div className="flex gap-1 bg-black/20 p-1 rounded-lg h-8 items-center">
                  {[1, 2, 4, 10].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setSimSpeed(s)} 
                      className={`w-7 h-6 flex items-center justify-center rounded text-[9px] font-black transition-all ${simSpeed === s ? 'bg-white text-brandblue shadow-md' : 'text-white/80 hover:text-white'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
                <button onClick={handleReset} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors" title="Reset">
                  <RotateCcw size={16} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <ShipMap ships={ships} onShipClick={(ship) => setSelectedShipId(ship.id)} selectedShipId={selectedShipId} />
        <SchedulePanel 
          ships={ships} 
          selectedShipId={selectedShipId} 
          onShipClick={setSelectedShipId} 
          isLoading={isLoading || (routeSegments.length > 0 && !isInitialCalcDone)} 
        />
      </div>
    </main>
  )
}
