// Transport API Client für transport.opendata.ch
import { unstable_cache } from 'next/cache'

export interface Location {
  id: string
  name: string
  coordinate: {
    type: string
    x: number
    y: number
  }
}

export interface Connection {
  from: Location
  to: Location
  duration: string
  service: string
  products: string[]
  capacity1st?: number
  capacity2nd?: number
}

export interface StationboardEntry {
  stop: {
    station: Location
    arrival?: string | null
    arrivalTimestamp?: number | null
    departure?: string | null
    departureTimestamp?: number | null
    delay?: number | null
    platform?: string | null
  }
  name: string
  category: string
  number: string
  to: string
  operator: string
  passList?: Array<{
    station: Location
    arrival?: string | null
    departure?: string | null
  }>
}

// Cache für Connections (client-seitig)
const connectionsCache = new Map<string, { data: Connection[]; timestamp: number }>()
const CONNECTIONS_CACHE_DURATION = 2 * 60 * 60 * 1000 // 2 Stunden Cache (länger, um Rate-Limits zu vermeiden)

export async function getConnections(
  from: string,
  to: string,
  date?: string,
  time?: string
): Promise<Connection[]> {
  // Erstelle Cache-Key
  const cacheKey = `${from}|${to}|${date || ''}|${time || ''}`
  
  // Prüfe Cache (nur client-seitig)
  if (typeof window !== 'undefined') {
    const cached = connectionsCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CONNECTIONS_CACHE_DURATION) {
      console.log(`[Cache Hit] Connections für ${from} -> ${to}`)
      return cached.data
    }
  }
  
  const params = new URLSearchParams({
    from,
    to,
  })
  
  if (date) params.append('date', date)
  if (time) params.append('time', time)

  const response = await fetch(`https://transport.opendata.ch/v1/connections?${params}`)
  
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(`Transport API error: Too Many Requests`)
    }
    throw new Error(`Transport API error: ${response.statusText}`)
  }

  const data = await response.json()
  const connections = data.connections || []
  
  // Speichere im Cache (nur client-seitig)
  if (typeof window !== 'undefined') {
    connectionsCache.set(cacheKey, { data: connections, timestamp: Date.now() })
  }
  
  return connections
}

/**
 * Lädt Stationboard-Daten von der API (ohne Caching)
 * Wird von unstable_cache verwendet
 */
async function fetchStationboardFromAPI(
  station: string,
  date?: string,
  time: string = '00:00',
  retryCount = 0,
  force = false
): Promise<StationboardEntry[]> {
  const dateStr = date || new Date().toISOString().split('T')[0]
  
  const isServer = typeof window === 'undefined'
  const baseUrl = isServer 
    ? (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') 
    : ''
  
  const params = new URLSearchParams({
    station,
    show_passlist: '1',
    time: time 
  })
  if (dateStr) params.append('date', dateStr)
  if (force) params.append('force', 'true')

  try {
    const response = await fetch(`${baseUrl}/api/stationboard?${params.toString()}`, {
      cache: force ? 'no-store' : 'default',
      signal: AbortSignal.timeout(15000) 
    })
    
    if (!response.ok) {
      if (response.status === 429 && retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
        return fetchStationboardFromAPI(station, dateStr, time, retryCount + 1)
      }
      return []
    }

    const data = await response.json()
    return data.stationboard || []
  } catch (error) {
    // Bei "Failed to fetch" (Netzwerkfehler) noch einmal versuchen
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return fetchStationboardFromAPI(station, dateStr, time, retryCount + 1)
    }
    console.warn(`Station ${station} konnte nach Retries nicht geladen werden:`, error)
    return []
  }
}

/**
 * Lädt Stationboard-Daten mit Next.js unstable_cache
 * Cache wird alle 6 Stunden geleert, damit neue Tagesdaten schneller verfügbar sind
 * Lädt standardmäßig alle Abfahrten ab 00:00 Uhr
 */
export async function getStationboard(
  station: string,
  date?: string,
  time: string = '00:00',
  force = false
): Promise<StationboardEntry[]> {
  const dateStr = date || new Date().toISOString().split('T')[0]
  
  // Verwende unstable_cache für server-seitiges Caching (nur wenn force false ist)
  if (typeof window === 'undefined' && !force) {
    const getCachedStationboard = unstable_cache(
      async () => fetchStationboardFromAPI(station, dateStr, time),
      [`stationboard-${station}-${dateStr}-${time}`],
      {
        revalidate: 21600, // 6 Stunden - Cache wird alle 6h geleert für neue Tagesdaten
        tags: [`stationboard-${station}`, `stationboard-${dateStr}`]
      }
    )
    
    return await getCachedStationboard()
  } else {
    // Client-seitig oder Force: Direkter API-Call
    return fetchStationboardFromAPI(station, dateStr, time, 0, force)
  }
}

// Client-seitiger Cache für Stationboards (verhindert mehrfaches Laden in einer Sitzung)
const stationboardMemoryCache = new Map<string, { data: StationboardEntry[], timestamp: number }>()
const SB_CACHE_DURATION = 1000 * 60 * 60 * 6 // 6 Stunden Client-Cache - wird alle 6h geleert für neue Tagesdaten

/**
 * Lädt Stationboard-Daten für alle Stationen eines Tages
 * Nutzt parallele Proxy-Anfragen für maximale Geschwindigkeit.
 * Der Proxy selbst kümmert sich um das Caching der externen API.
 */
export async function getAllStationsStationboard(
  stations: string[],
  date?: string,
  time: string = '00:00',
  force = false
): Promise<Map<string, StationboardEntry[]>> {
  const result = new Map<string, StationboardEntry[]>()
  const dateStr = date || new Date().toISOString().split('T')[0]
  
  console.log(`🚀 Starte paralleles Laden von ${stations.length} Stationen ab ${time} (Force: ${force})...`)

  // Erstelle alle Anfragen gleichzeitig
  const promises = stations.map(async (station, index) => {
    try {
      // Höherer initialer Offset (150ms), um den Browser-Netzwerk-Stack zu entlasten
      if (typeof window !== 'undefined') {
        await new Promise(resolve => setTimeout(resolve, index * 150))
      }
      
      const entries = await getStationboard(station, dateStr, time, force)
      if (entries.length === 0) {
        console.warn(`⚠️ Station ${station} lieferte 0 Abfahrten.`)
      } else {
        console.log(`✅ Station ${station}: ${entries.length} Abfahrten geladen.`)
      }
      return { station, entries }
    } catch (error) {
      // Fehler werden bereits in getStationboard / fetchStationboardFromAPI geloggt
      return { station, entries: [] as StationboardEntry[] }
    }
  })

  // Warte auf alle Ergebnisse
  const allResults = await Promise.all(promises)
  
  // In Map übertragen
  allResults.forEach(res => {
    result.set(res.station, res.entries)
  })

  return result
}

/**
 * Invalidiert den Cache für eine bestimmte Station oder alle
 * Hinweis: Mit unstable_cache wird der Cache automatisch nach revalidate-Zeit invalidiert
 * Für manuelle Invalidierung müsste revalidateTag() verwendet werden
 */
export async function clearStationboardCache(station?: string): Promise<void> {
  // unstable_cache wird automatisch nach revalidate-Zeit invalidiert
  // Für manuelle Invalidierung würde man revalidateTag() verwenden
  if (typeof window === 'undefined') {
    const { revalidateTag } = await import('next/cache')
    if (station) {
      revalidateTag(`stationboard-${station}`)
    } else {
      // Alle Stationboard-Caches invalidieren
      revalidateTag('stationboard')
    }
  }
}

export async function getLocations(query: string): Promise<Location[]> {
  const params = new URLSearchParams({ query })
  const response = await fetch(`https://transport.opendata.ch/v1/locations?${params}`)
  
  if (!response.ok) {
    throw new Error(`Transport API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.stations || []
}
