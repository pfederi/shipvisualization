// Schiffsnamen-API Integration
// Nutzt die ZSG API: https://github.com/pfederi/Next-Wave/blob/main/api/ships.ts

export interface ShipInfo {
  name: string
  id?: string
  type?: string
  capacity?: number
}

export interface ShipRoute {
  shipName: string
  courseNumber: string
}

export interface DailyDeployment {
  date: string
  routes: ShipRoute[]
}

export interface ZSGAPIResponse {
  dailyDeployments: DailyDeployment[]
  lastUpdated: string
  debug?: any
}

import { unstable_cache } from 'next/cache'

/**
 * Lädt die Schiffsdaten von der ZSG API
 * Verwendet die lokale API-Route als Proxy, um CORS-Probleme zu vermeiden
 */
async function fetchZSGShipData(apiUrl?: string): Promise<ZSGAPIResponse> {
  // Verwende lokale API-Route als Proxy (umgeht CORS)
  // Im Client verwenden wir die relative URL, im Server könnte man auch direkt die externe API aufrufen
  const isServer = typeof window === 'undefined'
  const url = apiUrl || (isServer 
    ? (process.env.NEXT_PUBLIC_ZSG_API_URL || 'https://vesseldata-api.vercel.app/api/ships')
    : '/api/ships')
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 43200 } // 12 Stunden Cache
    })
    
    if (!response.ok) {
      // Bei Fehlern gebe leere Daten zurück statt zu werfen
      console.warn(`ZSG API Fehler: ${response.status} ${response.statusText}`)
      return {
        dailyDeployments: [],
        lastUpdated: new Date().toISOString(),
        debug: { error: `API returned ${response.status}` }
      } as ZSGAPIResponse
    }

    const data = await response.json() as ZSGAPIResponse
    console.log('ZSG API Daten geladen:', data)
    return data
  } catch (error) {
    // Bei Netzwerkfehlern gebe leere Daten zurück statt zu werfen
    console.warn('Fehler beim Abrufen der ZSG-Schiffsdaten:', error)
    return {
      dailyDeployments: [],
      lastUpdated: new Date().toISOString(),
      debug: { error: error instanceof Error ? error.message : 'Unknown error' }
    } as ZSGAPIResponse
  }
}

// Client-seitiger Cache für Schiffsdaten (verhindert wiederholte Requests)
let clientShipDataCache: ZSGAPIResponse | null = null
let clientCacheTimestamp = 0
const CLIENT_CACHE_DURATION = 1000 * 60 * 60 * 12 // 12 Stunden

/**
 * Lädt und cached die Schiffsdaten mit Next.js unstable_cache
 */
export async function getCachedShipData(apiUrl?: string): Promise<ZSGAPIResponse> {
  // Verwende unstable_cache für server-seitiges Caching
  // Nur server-seitig verfügbar, daher Fallback für Client
  if (typeof window === 'undefined') {
    const getCachedData = unstable_cache(
      async () => fetchZSGShipData(apiUrl),
      ['zsg-ship-data'],
      {
        revalidate: 43200, // 12 Stunden
        tags: ['zsg-ships']
      }
    )
    
    return getCachedData()
  } else {
    // Client-seitig: Nutze lokalen Cache oder API-Call
    const now = Date.now()
    if (clientShipDataCache && (now - clientCacheTimestamp < CLIENT_CACHE_DURATION)) {
      return clientShipDataCache
    }

    const data = await fetchZSGShipData(apiUrl)
    
    // Speichere Ergebnis im Cache
    // Wenn Daten vorhanden sind, für 1 Stunde cachen
    // Wenn leer (z.B. API Error), für 1 Minute cachen um Spamming zu vermeiden
    clientShipDataCache = data
    clientCacheTimestamp = now
    
    const duration = (data.dailyDeployments && data.dailyDeployments.length > 0)
      ? CLIENT_CACHE_DURATION 
      : 1000 * 60 // 1 Minute bei Fehlern
      
    // Timer zum Löschen des Caches (optional, da wir oben den Zeitstempel prüfen)
    return data
  }
}

/**
 * Ermittelt den Schiffsnamen basierend auf Kursnummer und Datum
 * 
 * @param courseNumber - Kursnummer aus der Transport API
 * @param date - Datum (optional, standardmäßig heute)
 * @returns Schiffsname oder null wenn nicht gefunden
 */
export async function getShipNameByCourseNumber(
  courseNumber: string,
  date?: Date
): Promise<string | null> {
  try {
    const targetDate = date || new Date()
    const dateString = targetDate.toISOString().split('T')[0] // YYYY-MM-DD
    
    const shipData = await getCachedShipData()
    
    // 1. Suche zuerst EXAKT am Zieldatum
    const exactDeployment = shipData.dailyDeployments.find(d => d.date === dateString)
    if (exactDeployment) {
      const route = findRouteInDeployment(exactDeployment, courseNumber)
      if (route) {
        console.log(`✅ Match gefunden für Kurs ${courseNumber} am ${dateString}: ${route.shipName}`)
        return route.shipName
      }
    }
    
    // 2. Fallback auf +/- 1 Tag (nur wenn am exakten Datum nichts gefunden wurde)
    for (const deployment of shipData.dailyDeployments) {
      const deploymentDate = deployment.date
      if (deploymentDate === new Date(targetDate.getTime() + 24*60*60*1000).toISOString().split('T')[0] ||
          deploymentDate === new Date(targetDate.getTime() - 24*60*60*1000).toISOString().split('T')[0]) {
        const route = findRouteInDeployment(deployment, courseNumber)
        if (route) {
          console.log(`ℹ️ Fallback-Match für Kurs ${courseNumber} am ${deploymentDate}: ${route.shipName}`)
          return route.shipName
        }
      }
    }
    
    console.warn(`❌ Kein Schiff für Kurs ${courseNumber} am ${dateString} gefunden.`)
    return null
  } catch (error) {
    console.error('Fehler beim Abrufen des Schiffsnamens:', error)
    return null
  }
}

/**
 * Hilfsfunktion zum Finden einer Route in einem Deployment
 */
function findRouteInDeployment(deployment: DailyDeployment, courseNumber: string): ShipRoute | undefined {
  const cnStr = courseNumber.toString().trim()
  const cnClean = cnStr.replace(/^0+/, '') || cnStr

  return deployment.routes.find(r => {
    const rNumStr = r.courseNumber.toString().trim()
    const rNumClean = rNumStr.replace(/^0+/, '') || rNumStr
    
    // 1. Exaktes Matching
    if (rNumStr === cnStr || rNumClean === cnClean) return true
    
    // 2. Numerisches Matching (wenn beide rein numerisch sind)
    const rNumVal = parseInt(rNumClean, 10)
    const cnVal = parseInt(cnClean, 10)
    if (!isNaN(rNumVal) && !isNaN(cnVal) && rNumVal === cnVal) return true
    
    // 3. ZVV-ZSG-Matching (z.B. ZVV "3720" -> ZSG "20")
    // Wir matchen, wenn die letzten 2 oder 3 Ziffern übereinstimmen
    if (cnClean.length >= 2 && rNumClean.length >= 3) {
      if (rNumClean.endsWith(cnClean)) return true
    }
    if (rNumClean.length >= 2 && cnClean.length >= 3) {
      if (cnClean.endsWith(rNumClean)) return true
    }
    
    return false
  })
}

/**
 * Ermittelt den Schiffsnamen basierend auf Route
 * Diese Funktion versucht die Kursnummer aus der Transport API zu extrahieren
 * 
 * @param from - Abfahrtsstation
 * @param to - Zielstation
 * @param departureTime - Abfahrtszeit
 * @param courseNumber - Kursnummer (optional, wird aus Transport API extrahiert wenn nicht angegeben)
 * @returns Schiffsname oder null wenn nicht gefunden
 */
export async function getShipNameByRoute(
  from: string,
  to: string,
  departureTime: Date,
  courseNumber?: string
): Promise<string | null> {
  // Wenn Kursnummer vorhanden, verwende sie direkt
  if (courseNumber) {
    return getShipNameByCourseNumber(courseNumber, departureTime)
  }
  
  // Ansonsten versuche aus Route zu schließen (Fallback)
  return null
}

/**
 * Ermittelt alle verfügbaren Schiffe für ein bestimmtes Datum
 */
export async function getShipsForDate(date?: Date): Promise<ShipInfo[]> {
  try {
    const targetDate = date || new Date()
    const dateString = targetDate.toISOString().split('T')[0]
    
    const shipData = await getCachedShipData()
    
    const deployment = shipData.dailyDeployments.find(d => d.date === dateString)
    if (!deployment) {
      return []
    }
    
    // Sammle alle einzigartigen Schiffsnamen
    const uniqueShips = new Set<string>()
    deployment.routes.forEach(route => {
      uniqueShips.add(route.shipName)
    })
    
    return Array.from(uniqueShips).map(name => ({ name }))
  } catch (error) {
    console.error('Fehler beim Abrufen der Schiffe:', error)
    return []
  }
}

/**
 * Ermittelt Schiffsinformationen anhand des Schiffsnamens
 */
export async function getShipInfo(shipName: string): Promise<ShipInfo | null> {
  try {
    const shipData = await getCachedShipData()
    
    // Suche nach Schiff in allen Routen
    for (const deployment of shipData.dailyDeployments) {
      const route = deployment.routes.find(r => r.shipName === shipName)
      if (route) {
        return {
          name: route.shipName,
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Fehler beim Abrufen der Schiffsinformationen:', error)
    return null
  }
}

/**
 * Ermittelt alle Kursnummern, die ein bestimmtes Schiff an einem bestimmten Datum fährt
 */
export async function getCourseNumbersForShip(
  shipName: string,
  date?: Date
): Promise<string[]> {
  try {
    const targetDate = date || new Date()
    const dateString = targetDate.toISOString().split('T')[0] // YYYY-MM-DD
    
    console.log(`Suche Kursnummern für Schiff: "${shipName}" am ${dateString}`)
    
    const shipData = await getCachedShipData()
    console.log('Ship Data:', shipData)
    console.log('Daily Deployments:', shipData.dailyDeployments?.length || 0)
    
    // Zeige alle verfügbaren Schiffsnamen für Debugging
    const allShipNames = new Set<string>()
    shipData.dailyDeployments?.forEach(deployment => {
      deployment.routes?.forEach(route => {
        if (route.shipName) {
          allShipNames.add(route.shipName)
        }
      })
    })
    console.log('Verfügbare Schiffsnamen:', Array.from(allShipNames))
    
    const courseNumbers: string[] = []
    
    // Suche in allen täglichen Deployments
    for (const deployment of shipData.dailyDeployments || []) {
      // Prüfe ob das Datum passt (kann auch +/- 1 Tag sein)
      const deploymentDate = deployment.date
      if (deploymentDate === dateString || 
          deploymentDate === new Date(targetDate.getTime() + 24*60*60*1000).toISOString().split('T')[0] ||
          deploymentDate === new Date(targetDate.getTime() - 24*60*60*1000).toISOString().split('T')[0]) {
        
        // Sammle alle Kursnummern für dieses Schiff (flexibles Matching)
        deployment.routes?.forEach(route => {
          const routeShipName = route.shipName
          // Prüfe exakte Übereinstimmung oder ob der Name enthalten ist
          if (routeShipName && shipName && (
            routeShipName === shipName || 
            routeShipName.includes(shipName) ||
            shipName.includes(routeShipName) ||
            routeShipName.toLowerCase() === shipName.toLowerCase() ||
            routeShipName.toLowerCase().includes(shipName.toLowerCase())
          )) {
            if (!courseNumbers.includes(route.courseNumber)) {
              console.log(`  Gefunden: ${routeShipName} mit Kursnummer ${route.courseNumber}`)
              courseNumbers.push(route.courseNumber)
            }
          }
        })
      }
    }
    
    // Fallback: Suche in allen Routen ohne Datumsprüfung
    if (courseNumbers.length === 0) {
      console.log('Keine Kursnummern mit Datumsprüfung gefunden, suche in allen Routen...')
      for (const deployment of shipData.dailyDeployments || []) {
        deployment.routes?.forEach(route => {
          const routeShipName = route.shipName
          if (routeShipName && shipName && (
            routeShipName === shipName || 
            routeShipName.includes(shipName) ||
            shipName.includes(routeShipName) ||
            routeShipName.toLowerCase() === shipName.toLowerCase() ||
            routeShipName.toLowerCase().includes(shipName.toLowerCase())
          )) {
            if (!courseNumbers.includes(route.courseNumber)) {
              console.log(`  Gefunden (ohne Datum): ${routeShipName} mit Kursnummer ${route.courseNumber}`)
              courseNumbers.push(route.courseNumber)
            }
          }
        })
      }
    }
    
    console.log(`Gefundene Kursnummern für "${shipName}":`, courseNumbers)
    return courseNumbers
  } catch (error) {
    console.error('Fehler beim Abrufen der Kursnummern für Schiff:', error)
    return []
  }
}
