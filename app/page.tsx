'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { RotateCcw, Ship } from 'lucide-react'

// Types & Libs
import { ShipPosition, calculateShipPosition } from '@/lib/ship-position'
import { getStationCoordinates, normalizeStationName, LAKES, loadLakeData, Station } from '@/lib/lakes-config'
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
const PRE_DEPARTURE_DWELL_MS = 1 * 60 * 1000 // 1 Minute für Schiffe, die von der Werft kommen
const POST_ARRIVAL_GRACE_MS = 0 // Kein Puffer mehr nötig, da wir Segmente verknüpfen

export default function Home() {
  const { t, language } = useI18n()
  const { theme } = useTheme()
  
  // --- STATE ---
  const [selectedLakeId, setSelectedLakeId] = useState<string>('zurichsee')
  const [lakeStations, setLakeStations] = useState<Station[]>([])
  const [lakeMapping, setLakeMapping] = useState<Record<string, string>>({})
  const [ships, setShips] = useState<ShipPosition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null)
  const [routeSegments, setRouteSegments] = useState<any[]>([])
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

  const selectedLake = useMemo(() => LAKES[selectedLakeId], [selectedLakeId])

  // --- REFS ---
  const baseRealTimeRef = useRef<number>(Date.now())
  const baseSimTimeRef = useRef<number>(0)
  const lastLoadedKeyRef = useRef<string>("")

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

  // --- DATA LOADING ---
  const loadDailySchedule = useCallback(async (targetDate: Date, force = false) => {
    const dateStr = targetDate.toISOString().split('T')[0]
    const modeKey = isLiveMode ? 'live' : 'sim'
    const currentKey = `${dateStr}-${modeKey}${force ? '-force' : ''}`
    
    if (lastLoadedKeyRef.current === currentKey) return
    lastLoadedKeyRef.current = currentKey

    try {
      setIsLoading(true)
      
      // Lade Stationsdaten für diesen See
      const { stations, mapping } = await loadLakeData(selectedLakeId)
      setLakeStations(stations)
      setLakeMapping(mapping)

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

      if (selectedLake.hasShipNames) {
        await getCachedShipData().catch(() => {})
      }
      const stationNames = stations.map(s => s.uic_ref || s.name)
      const stationCoords = getStationCoordinates(stations)
      
      const [stationboardMap, geoRoutes] = await Promise.all([
        getAllStationsStationboard(stationNames, dateStr, "00:00", force),
        getCachedGeoJSONRoutes(selectedLake.geojsonPath)
      ])
      
      const totalEntries = Array.from(stationboardMap.values()).reduce((sum, arr) => sum + arr.length, 0)
      console.log(`📡 Stationboard geladen für ${selectedLake.name}: ${stationboardMap.size} Stationen, ${totalEntries} Einträge`)
      
      const processedSegments: any[] = []
      const debugStats = {
        totalEntries: 0,
        skippedNoPassList: 0,
        skippedNoDeparture: 0,
        skippedNoArrival: 0,
        created: 0
      }
      
      for (const [stationId, entries] of stationboardMap.entries()) {
        for (const entry of entries) {
          debugStats.totalEntries++
          
          if (!entry.name || !entry.passList || entry.passList.length < 2) {
            debugStats.skippedNoPassList++
            continue
          }
          
          // Extrahiere Kursnummer - WICHTIG: Speichere VOLLE Nummer für eindeutige Identifikation
          // Kürze nur für die API-Abfrage, aber behalte die volle Nummer für die Deduplizierung
          const internalNumRaw = entry.name.match(/\d+/)?.[0] || "0"
          const internalNumShort = internalNumRaw.replace(/^0+/, '') || "0" // Gekürzt für API-Abfrage
          const officialNumRaw = entry.number || internalNumRaw
          const officialNumShort = officialNumRaw.replace(/^0+/, '') || internalNumShort

          const shipName = selectedLake.hasShipNames 
            ? await getShipNameByCourseNumber(internalNumShort, targetDate)
            : null
            
          // Wenn kein Schiffsname gefunden wurde, zeige nur "Schiff" ohne Kursnummer
          // (Die Kursnummer wird separat als Chip angezeigt)
          const displayName = shipName || `Schiff`

          for (let i = 0; i < entry.passList.length - 1; i++) {
            const currentPass = entry.passList[i]
            
            // WICHTIG: Wenn station null ist, ist es die Startstation (die Station für die wir das Stationboard laden)
            let fromName = normalizeStationName(currentPass.station?.name || "", mapping)
            if (!fromName) {
              // Verwende die Hauptstation als Startpunkt
              fromName = normalizeStationName(entry.stop.station.name, mapping)
            }
            if (!fromName) continue
            
            // API-Bug Fix: Suche die tatsächliche Abfahrt für diese Station
            let lastSameStationIdx = i
            let bestDeparture: string | null = currentPass.departure || currentPass.arrival || null
            
            while (lastSameStationIdx + 1 < entry.passList.length && 
                   normalizeStationName(entry.passList[lastSameStationIdx + 1].station?.name || "", mapping) === fromName) {
              lastSameStationIdx++
              if (!bestDeparture) {
                bestDeparture = entry.passList[lastSameStationIdx].departure || entry.passList[lastSameStationIdx].arrival || null
              }
            }
            
            // WICHTIG: Falls wir gerade an der Station sind, für die wir das Stationboard geladen haben,
            // und im passList keine Zeit steht, nimm die Zeit aus dem Haupt-Entry
            const normalizedMainStation = normalizeStationName(entry.stop.station.name, mapping)
            if (!bestDeparture && fromName === normalizedMainStation) {
              bestDeparture = entry.stop.departure || entry.stop.arrival || null
            }
            
            // ZUSÄTZLICHER FIX: Wenn immer noch keine Zeit, prüfe ob es eine Durchfahrt ist
            // und nimm die Ankunftszeit als Abfahrtszeit (bei Durchfahrten sind beide gleich)
            if (!bestDeparture && currentPass.arrival) {
              bestDeparture = currentPass.arrival
            }
            
            if (!bestDeparture) {
              debugStats.skippedNoDeparture++
              i = lastSameStationIdx
              continue
            }
            
            // Nächste Station suchen
            let targetIdx = lastSameStationIdx + 1
            if (targetIdx >= entry.passList.length) break
            
            const to = entry.passList[targetIdx]
            const bestArrival = to.arrival || to.departure || null
            
            if (!to.station?.name || !bestArrival) {
              debugStats.skippedNoArrival++
              i = lastSameStationIdx
              continue
            }

            const depTime = new Date(bestDeparture), arrTime = new Date(bestArrival)
            if (isNaN(depTime.getTime())) {
              i = lastSameStationIdx
              continue
            }

            // Plausibilitätscheck für Fahrzeit
            let finalArrTime = arrTime
            if (isNaN(finalArrTime.getTime()) || finalArrTime <= depTime) {
              finalArrTime = new Date(depTime.getTime() + 5 * 60 * 1000)
            }

            const toName = normalizeStationName(to.station.name, mapping)
            const segment = createRouteSegmentFromStationboard(
              fromName, toName,
              depTime, officialNumShort, stationCoords, geoRoutes, finalArrTime, internalNumShort
            )


            if (segment) {
              debugStats.created++
              
              // Intelligente Berechnung von arrivalAtFromStation:
              // Prüfe, ob das Schiff VORHER an dieser Station angekommen ist
              let arrivalAtFrom: Date | undefined = undefined
              
              // Durchsuche vorherige PassList-Einträge nach einer Ankunft an dieser Station
              for (let j = 0; j < i; j++) {
                const prevPass = entry.passList[j]
                const prevStationName = normalizeStationName(prevPass.station?.name || "", mapping)
                if (prevStationName === fromName && prevPass.arrival) {
                  const prevArrival = new Date(prevPass.arrival)
                  // Nur verwenden, wenn die Ankunft VOR der Abfahrt liegt
                  if (prevArrival.getTime() < depTime.getTime()) {
                    arrivalAtFrom = prevArrival
                  }
                }
              }
              
              // Fallback: Wenn keine vorherige Ankunft gefunden wurde, 1 Minute vor Abfahrt (Werft/Depot)
              if (!arrivalAtFrom) {
                arrivalAtFrom = new Date(depTime.getTime() - PRE_DEPARTURE_DWELL_MS)
              }
              
              processedSegments.push({
                segment: {
                  ...segment,
                  arrivalAtFromStation: arrivalAtFrom,
                  // WICHTIG: Speichere VOLLE Kursnummer (ohne Kürzung) für eindeutige Identifikation
                  // So werden Kurs 29 und Kurs 2529 als unterschiedliche Schiffe behandelt
                  resolvedShipName: displayName, 
                  internalCourseNumber: internalNumRaw, // VOLLE Nummer
                  officialCourseNumber: officialNumRaw  // VOLLE Nummer
                }
              })
            }
            
            // Weiter bei der neuen Station
            i = lastSameStationIdx
          }
        }
      }

      // Deduplizierung: Entferne nur echte Duplikate (gleiche Fahrt, mehrfach geladen)
      const uniqueMap = new Map()
      const duplicateLog: string[] = []
      
      processedSegments.forEach(s => {
        // Normalisiere Zeit auf volle Minute (60 Sekunden)
        const roundedTime = Math.round(s.segment.departureTime.getTime() / 60000) * 60000
        
        // Key: Von + Nach + Abfahrtszeit + Ankunftszeit
        // Das sollte eine eindeutige Fahrt identifizieren
        const roundedArrival = Math.round(s.segment.arrivalTime.getTime() / 60000) * 60000
        const key = `${s.segment.from.name}|${s.segment.to.name}|${roundedTime}|${roundedArrival}`
        
        // Bei Duplikaten: Behalte das Segment mit mehr Informationen (z.B. RouteCoordinates)
        const existing = uniqueMap.get(key)
        if (existing) {
          const depStr = new Date(roundedTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
          duplicateLog.push(`   Duplikat: ${s.segment.from.name} → ${s.segment.to.name} um ${depStr} (${s.segment.resolvedShipName})`)
        }
        
        if (!existing || (s.segment.routeCoordinates && !existing.segment.routeCoordinates)) {
          uniqueMap.set(key, s)
        }
      })
      
      if (duplicateLog.length > 0) {
        console.log(`\n🔍 Gefundene Duplikate (${duplicateLog.length}):`)
        duplicateLog.slice(0, 20).forEach(log => console.log(log))
        if (duplicateLog.length > 20) {
          console.log(`   ... und ${duplicateLog.length - 20} weitere`)
        }
      }
      
      const finalSegments = Array.from(uniqueMap.values())
      
      // NEUE LOGIK: Verknüpfe Segmente desselben Schiffs chronologisch
      // Gruppiere Segmente nach Schiff
      const segmentsByShipKey = new Map<string, typeof finalSegments>()
      finalSegments.forEach(s => {
        const shipKey = s.segment.resolvedShipName || s.segment.internalCourseNumber || s.segment.officialCourseNumber
        if (!segmentsByShipKey.has(shipKey)) {
          segmentsByShipKey.set(shipKey, [])
        }
        segmentsByShipKey.get(shipKey)!.push(s)
      })
      
      // Für jedes Schiff: Sortiere Segmente chronologisch und aktualisiere arrivalAtFromStation
      segmentsByShipKey.forEach((segments, shipKey) => {
        // Sortiere nach Abfahrtszeit
        segments.sort((a, b) => a.segment.departureTime.getTime() - b.segment.departureTime.getTime())
        
        // Verknüpfe Segmente: Wenn Segment N an Station X endet und Segment N+1 an Station X startet,
        // dann verwende die Ankunftszeit von Segment N als arrivalAtFromStation für Segment N+1
        for (let i = 0; i < segments.length - 1; i++) {
          const currentSeg = segments[i].segment
          const nextSeg = segments[i + 1].segment
          
          // Prüfe, ob das nächste Segment an der Station startet, wo das aktuelle endet
          if (currentSeg.to.name === nextSeg.from.name) {
            // Verwende die Ankunftszeit des aktuellen Segments als arrivalAtFromStation für das nächste
            nextSeg.arrivalAtFromStation = currentSeg.arrivalTime
          }
        }
      })
      
      console.log(`📊 Verarbeitungsstatistik:`)
      console.log(`   Total Einträge: ${debugStats.totalEntries}`)
      console.log(`   ❌ Übersprungen (kein passList): ${debugStats.skippedNoPassList}`)
      console.log(`   ❌ Übersprungen (keine Abfahrtszeit): ${debugStats.skippedNoDeparture}`)
      console.log(`   ❌ Übersprungen (keine Ankunftszeit): ${debugStats.skippedNoArrival}`)
      console.log(`   ✅ Segmente erstellt: ${debugStats.created}`)
      console.log(`   📦 Roh-Segmente: ${processedSegments.length}`)
      console.log(`   🎯 Nach Deduplizierung: ${finalSegments.length}`)
      
      // Zeige Zusammenfassung pro Schiff
      const segmentsByShip = new Map<string, any[]>()
      finalSegments.forEach(s => {
        const key = s.segment.resolvedShipName || s.segment.internalCourseNumber
        if (!segmentsByShip.has(key)) segmentsByShip.set(key, [])
        segmentsByShip.get(key)!.push(s)
      })
      
      console.log(`\n🚢 Segmente pro Schiff:`)
      for (const [shipName, segments] of segmentsByShip.entries()) {
        const firstSeg = segments[0].segment
        const lastSeg = segments[segments.length - 1].segment
        const firstTime = new Date(firstSeg.departureTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
        const lastTime = new Date(lastSeg.arrivalTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
        console.log(`   ${shipName}: ${segments.length} Segmente (${firstTime} - ${lastTime})`)
      }
      
      setRouteSegments(finalSegments)
      setGeoJSONRoutes(geoRoutes)
      setIsInitialCalcDone(false) // Trigger neue initiale Berechnung
      setIsLoading(false)
    } catch (error) {
      console.error('Load failed:', error)
      setIsLoading(false)
    }
  }, [isLiveMode, selectedLakeId, selectedLake.geojsonPath, selectedLake.name, selectedLake.hasShipNames])

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
    const activePromises = routeSegments.map(async ({ segment }) => {
      const { from, to, departureTime, arrivalTime, arrivalAtFromStation, resolvedShipName, internalCourseNumber, officialCourseNumber } = segment
      const shipId = `ship-${internalCourseNumber}-${departureTime.getTime()}`
      const depTime = departureTime.getTime()
      const arrTime = arrivalTime.getTime()
      
      // Berechne Dwell-Time: Entweder aus API oder Fallback
      const startDwellTime = arrivalAtFromStation ? arrivalAtFromStation.getTime() : (depTime - PRE_DEPARTURE_DWELL_MS)
      const endGraceTime = arrTime + POST_ARRIVAL_GRACE_MS

      // 1. Am Abfahrtsort wartend
      if (nowTime >= startDwellTime && nowTime < depTime) {
        return {
          id: shipId, name: resolvedShipName, latitude: from.lat, longitude: from.lon,
          course: 0, speed: 0, nextStop: to.name, status: 'at_station',
          departureTime, arrivalTime, fromStation: from.name, toStation: to.name,
          internalCourseNumber, officialCourseNumber
        } as ShipPosition
      } 
      // 2. In Fahrt (nicht mehr bis zur Ankunftszeit inklusiv, sondern strikt kleiner)
      else if (nowTime >= depTime && nowTime < arrTime) {
        const pos = await calculateShipPosition([segment], now, geoJSONRoutes)
        if (pos) {
          return { ...pos, id: shipId, name: resolvedShipName, status: 'driving', internalCourseNumber, officialCourseNumber } as ShipPosition
        }
      } 
      // 3. Am Zielort angekommen (kurzer Puffer nach Ankunft)
      else if (nowTime >= arrTime && nowTime < endGraceTime) {
        return {
          id: shipId, name: resolvedShipName, latitude: to.lat, longitude: to.lon,
          course: 0, speed: 0, nextStop: 'Angekommen', status: 'at_station',
          departureTime, arrivalTime, fromStation: from.name, toStation: to.name,
          internalCourseNumber, officialCourseNumber
        } as ShipPosition
      }
      return null
    })

    const results = await Promise.all(activePromises)
    const activePositions = results.filter((p): p is ShipPosition => p !== null)
    
    // Debug: Zeige Statistik nur beim ersten Mal
    if (!isInitialCalcDone) {
      console.log(`\n⏰ Positionsberechnung für ${now.toLocaleTimeString('de-CH')}:`)
      console.log(`   Geprüfte Segmente: ${routeSegments.length}`)
      console.log(`   Aktive Positionen: ${activePositions.length}`)
    }

    const finalMap = new Map<string, ShipPosition>()
    activePositions.forEach(p => {
      // WICHTIG: Verwende Schiffsname + VOLLE Kursnummer (ohne Kürzung) als eindeutigen Key
      // So werden Kurs 29 und Kurs 2529 als unterschiedliche Schiffe behandelt
      const fullCourseNum = p.internalCourseNumber || p.officialCourseNumber || p.courseNumber || ""
      const key = `${p.name}|${fullCourseNum}`
      const existing = finalMap.get(key)
      
      if (!existing) {
        finalMap.set(key, p)
        return
      }

      // Prioritäten-Logik bei Duplikaten:
      // 1. Fahrende Schiffe haben IMMER Vorrang vor stehenden
      if (p.status === 'driving' && existing.status === 'at_station') {
        finalMap.set(key, p)
        return
      }
      if (existing.status === 'driving' && p.status === 'at_station') {
        return 
      }
      
      // 2. Wenn beide stehen (at_station): Bevorzuge das Segment, das zeitlich näher an "jetzt" ist
      if (p.status === 'at_station' && existing.status === 'at_station') {
        // Berechne Distanz zur aktuellen Zeit für beide Segmente
        const pDepTime = p.departureTime?.getTime() || 0
        const existingDepTime = existing.departureTime?.getTime() || 0
        const pArrTime = p.arrivalTime?.getTime() || 0
        const existingArrTime = existing.arrivalTime?.getTime() || 0
        
        // Für "bereitstehende" Schiffe: Wie weit ist die Abfahrt entfernt?
        // Für "angekommene" Schiffe: Wie lange ist die Ankunft her?
        const pDistanceToNow = Math.min(
          Math.abs(nowTime - pDepTime),  // Distanz zur Abfahrt
          Math.abs(nowTime - pArrTime)   // Distanz zur Ankunft
        )
        const existingDistanceToNow = Math.min(
          Math.abs(nowTime - existingDepTime),
          Math.abs(nowTime - existingArrTime)
        )
        
        // Bevorzuge das Segment, das zeitlich näher liegt
        if (pDistanceToNow < existingDistanceToNow) {
          finalMap.set(key, p)
        }
        return
      }
      
      // 3. Wenn beide fahren: Das Segment mit der SPÄTEREN Abfahrtszeit gewinnt (aktuellere Fahrt)
      if (p.departureTime && existing.departureTime && p.departureTime.getTime() > existing.departureTime.getTime()) {
        finalMap.set(key, p)
      }
    })
    
    const finalShips = Array.from(finalMap.values()).sort((a, b) => {
      // Sortiere nach Abfahrtszeit (früheste zuerst)
      if (!a.departureTime && !b.departureTime) return 0
      if (!a.departureTime) return 1
      if (!b.departureTime) return -1
      return a.departureTime.getTime() - b.departureTime.getTime()
    })
    
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
              
              {/* Lake Selection */}
              <div className="flex items-center bg-black/10 rounded-xl p-1 border border-white/10 h-[52px]">
                <select 
                  value={selectedLakeId} 
                  onChange={(e) => {
                    const newLakeId = e.target.value
                    setSelectedLakeId(newLakeId)
                    // Reset everything when lake changes
                    setShips([])
                    setRouteSegments([])
                    setLakeStations([])
                    setLakeMapping({})
                    setIsInitialCalcDone(false)
                    lastLoadedKeyRef.current = ""
                    // loadDailySchedule wird durch useEffect getriggert
                  }}
                  className="bg-transparent text-white text-xs font-black px-4 h-full rounded-lg outline-none cursor-pointer hover:bg-white/5 transition-colors appearance-none"
                >
                  {Object.values(LAKES).map(lake => (
                    <option key={lake.id} value={lake.id} className="bg-brandblue text-white">
                      {lake.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

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
            <div className="flex flex-col">
              <h1 className="text-xs font-black tracking-tight uppercase opacity-60 line-clamp-1">{t.title}</h1>
              <select 
                value={selectedLakeId} 
                onChange={(e) => {
                  const newLakeId = e.target.value
                  setSelectedLakeId(newLakeId)
                  setShips([])
                  setRouteSegments([])
                  setLakeStations([])
                  setLakeMapping({})
                  setIsInitialCalcDone(false)
                  lastLoadedKeyRef.current = ""
                }}
                className="bg-transparent text-white text-base font-black outline-none cursor-pointer p-0 -ml-0.5"
              >
                {Object.values(LAKES).map(lake => (
                  <option key={lake.id} value={lake.id} className="bg-brandblue text-white">
                    {lake.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
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
            <ShipMap ships={ships} onShipClick={(ship) => setSelectedShipId(ship.id)} selectedShipId={selectedShipId} selectedLakeId={selectedLakeId} stations={lakeStations} />
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
            isLoading={isLoading || (routeSegments.length > 0 && !isInitialCalcDone)} 
            isLiveMode={isLiveMode}
            onToggleMode={toggleMode}
            nextDepartures={nextDepartures}
            onReleaseNotesClick={() => setIsReleaseNotesOpen(true)}
            simulationTime={simulationTime}
            selectedDate={selectedDate}
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
                  setIsMobilePanelOpen(false)
                }} 
                isLoading={isLoading || (routeSegments.length > 0 && !isInitialCalcDone)} 
                isLiveMode={isLiveMode}
                onToggleMode={toggleMode}
                nextDepartures={nextDepartures}
                onReleaseNotesClick={() => setIsReleaseNotesOpen(true)}
                simulationTime={simulationTime}
                selectedDate={selectedDate}
                isMobile={true}
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
