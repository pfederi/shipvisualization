import { NextResponse } from 'next/server'

// In-Memory Cache für den Server (als zusätzliche Schicht zu Next.js Cache)
const serverCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 60 * 6 // 6 Stunden - Cache wird alle 6h geleert für neue Tagesdaten

// Request-Deduplication: Verhindere mehrfache gleichzeitige Anfragen für dieselbe Station
const pendingRequests = new Map<string, Promise<any>>()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const station = searchParams.get('station')
  const date = searchParams.get('date')
  const time = searchParams.get('time') || '00:00' // Standardmäßig ab Mitternacht
  const show_passlist = searchParams.get('show_passlist') || '1'
  const force = searchParams.get('force') === 'true'

  if (!station) {
    return NextResponse.json({ error: 'Station is required' }, { status: 400 })
  }

  const cacheKey = `${station}-${date || 'today'}-${time}`
  const now = Date.now()

  // 1. Prüfe In-Memory Cache (nur wenn force nicht gesetzt ist)
  if (!force) {
    const cached = serverCache.get(cacheKey)
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      return NextResponse.json(cached.data)
    }
  }

  // 2. Request-Deduplication: Wenn bereits eine Anfrage für diese Station läuft, warte darauf
  const pendingKey = cacheKey
  if (pendingRequests.has(pendingKey)) {
    console.log(`⏳ Warte auf laufende Anfrage für ${station}...`)
    const result = await pendingRequests.get(pendingKey)
    return NextResponse.json(result)
  }

  // 3. Erstelle neue Anfrage und speichere Promise
  const requestPromise = (async () => {
    try {
      const externalUrl = new URL('https://transport.opendata.ch/v1/stationboard')
      externalUrl.searchParams.append('station', station)
      externalUrl.searchParams.append('limit', '200') // Erhöht auf 200
      if (date) externalUrl.searchParams.append('date', date)
      if (time) externalUrl.searchParams.append('time', time)
      externalUrl.searchParams.append('type', 'departure')
      externalUrl.searchParams.append('show_passlist', show_passlist)
      externalUrl.searchParams.append('transportations[]', 'ship')

      const response = await fetch(externalUrl.toString(), {
        cache: force ? 'no-store' : 'default',
        next: { revalidate: force ? 0 : 43200 }
      })

      if (!response.ok) {
        // Versuche die Fehlermeldung zu lesen
        let errorMessage = `External API returned ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData.errors && errorData.errors.length > 0) {
            errorMessage = errorData.errors[0].message || errorMessage
          }
        } catch (e) {
          // Ignoriere JSON-Parse-Fehler
        }

        if (response.status === 429) {
          console.error(`⚠️ Rate limit hit for station: ${station}`)
          
          // Fallback auf alte gecachte Daten
          const cached = serverCache.get(cacheKey)
          if (cached) {
            console.log(`📦 Verwende gecachte Daten für ${station} (wegen Rate-Limit)`)
            return cached.data
          }
          
          // Bei Rate Limit: Gebe leere Liste zurück statt Fehler zu werfen
          console.warn(`⚠️ Rate limit für ${station}, keine gecachten Daten verfügbar`)
          return { stationboard: [] }
        }

        // Für andere Fehler: Logge und gebe leere Liste zurück
        console.error(`❌ API-Fehler für Station "${station}": ${errorMessage}`)
        return { stationboard: [] }
      }

      const data = await response.json()
      
      // Prüfe ob die Antwort ein Fehler-Objekt ist
      if (data.errors && data.errors.length > 0) {
        console.error(`❌ API-Fehler in Response für Station "${station}":`, data.errors[0].message)
        return { stationboard: [] }
      }
      
      // Im Server-Memory speichern (ABER NUR WENN DATEN GEFUNDEN WURDEN)
      // Wenn die Liste leer ist, cachen wir sie nicht, um bei Fehlern erneut zu versuchen
      if (data.stationboard && data.stationboard.length > 0) {
        serverCache.set(cacheKey, { data, timestamp: now })
      }

      // Cache-Cleanup (verhindert Memory Leaks)
      if (serverCache.size > 500) {
        const oldestKey = serverCache.keys().next().value
        if (oldestKey) serverCache.delete(oldestKey)
      }

      return data
    } catch (error) {
      // Behandle alle Fehler und gebe leere Liste zurück statt zu crashen
      console.error(`❌ Stationboard Proxy Error für Station "${station}":`, error)
      if (error instanceof Error) {
        console.error(`   Fehlermeldung: ${error.message}`)
        console.error(`   Stack: ${error.stack}`)
      }
      return { stationboard: [] }
    }
  })()

  // Speichere Promise für Request-Deduplication
  pendingRequests.set(pendingKey, requestPromise)

  try {
    const data = await requestPromise
    // Stelle sicher, dass immer ein stationboard-Array zurückgegeben wird
    return NextResponse.json({
      stationboard: data?.stationboard || [],
      ...(data?.errors && { errors: data.errors })
    })
  } catch (error) {
    // Fallback: Sollte eigentlich nicht erreicht werden, da requestPromise immer ein Objekt zurückgibt
    console.error(`❌ Unerwarteter Fehler in Stationboard-Route für "${station}":`, error)
    return NextResponse.json({ 
      stationboard: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    // Entferne Promise nach Abschluss
    pendingRequests.delete(pendingKey)
  }
}

// OPTIONS Handler für Preflight-Requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
