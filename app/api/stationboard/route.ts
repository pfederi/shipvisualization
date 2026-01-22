import { NextResponse } from 'next/server'

// In-Memory Cache für den Server (als zusätzliche Schicht zu Next.js Cache)
const serverCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 60 * 12 // 12 Stunden für Fahrplan-Daten

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const station = searchParams.get('station')
  const date = searchParams.get('date')
  const time = searchParams.get('time') || '00:00' // Standardmäßig ab Mitternacht
  const show_passlist = searchParams.get('show_passlist') || '1'

  if (!station) {
    return NextResponse.json({ error: 'Station is required' }, { status: 400 })
  }

  const cacheKey = `${station}-${date || 'today'}-${time}`
  const now = Date.now()

  // 1. Prüfe In-Memory Cache
  const cached = serverCache.get(cacheKey)
  if (cached && (now - cached.timestamp < CACHE_DURATION)) {
    return NextResponse.json(cached.data)
  }

  try {
    const externalUrl = new URL('https://transport.opendata.ch/v1/stationboard')
    externalUrl.searchParams.append('station', station)
    externalUrl.searchParams.append('limit', '100') // Mehr Daten laden, um seltener anzufragen
    if (date) externalUrl.searchParams.append('date', date)
    if (time) externalUrl.searchParams.append('time', time)
    externalUrl.searchParams.append('type', 'departure')
    externalUrl.searchParams.append('show_passlist', show_passlist)
    externalUrl.searchParams.append('transportations[]', 'ship') // NUR Schiffe laden!

    const response = await fetch(externalUrl.toString(), {
      next: { revalidate: 43200 } // Next.js Cache für 12 Stunden
    })

    if (!response.ok) {
      if (response.status === 429) {
        console.error(`Rate limit hit for station: ${station}`)
        return NextResponse.json({ error: 'External Rate Limit' }, { status: 429 })
      }
      throw new Error(`External API returned ${response.status}`)
    }

    const data = await response.json()
    
    // 2. Im Server-Memory speichern
    serverCache.set(cacheKey, { data, timestamp: now })

    // Cache-Cleanup (verhindert Memory Leaks)
    if (serverCache.size > 500) {
      const oldestKey = serverCache.keys().next().value
      if (oldestKey) serverCache.delete(oldestKey)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Stationboard Proxy Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
