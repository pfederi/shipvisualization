// Logik zur Berechnung der Schiffsposition basierend auf Fahrplan
import { getShipNameByRoute, getShipNameByCourseNumber } from './ship-names-api'
import { ShipRouteData, RouteCoordinate } from './geojson-routes'

export interface ShipPosition {
  id: string
  name: string
  latitude: number
  longitude: number
  course: number
  speed: number
  nextStop: string
  arrivalTime?: Date
  departureTime?: Date
  fromStation?: string
  toStation?: string
  courseNumber?: string // Offizielle Nummer (z.B. 3732)
  internalCourseNumber?: string // Interne Nummer für Schiffsnamen (z.B. 64)
  officialCourseNumber?: string // Explizite ZVV Nummer (z.B. 3732)
  status?: 'driving' | 'at_station'
}

export interface RouteSegment {
  from: { lat: number; lon: number; name: string }
  to: { lat: number; lon: number; name: string }
  departureTime: Date
  arrivalTime: Date
  distance: number
  courseNumber?: string // Offizielle Kursnummer (z.B. 3732)
  internalCourseNumber?: string // Interne Kursnummer für Schiffsnamen (z.B. 64)
  routeCoordinates?: RouteCoordinate[] // Koordinaten entlang der Route
  resolvedShipName?: string // Bereits aufgelöster Schiffsname
  lakeId?: string // See-ID für seespezifische Route-Findung
}

// Geschwindigkeiten in Knoten (ca.)
const CRUISING_SPEED = 12 // Normale Fahrtgeschwindigkeit
const APPROACH_SPEED = 6 // Langsamere Geschwindigkeit bei Ankunft/Abfahrt
const APPROACH_DISTANCE = 0.25 // km vor/nach Haltestelle (250m)
const AVERAGE_SPEED_KMH = 22 // Durchschnittliche Geschwindigkeit in km/h für Schätzung

// Haversine-Formel für Distanzberechnung
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Erdradius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Findet die passende Route aus GeoJSON-Routen zwischen zwei Stationen
function findRouteBetweenStations(
  routes: ShipRouteData[],
  from: { lat: number; lon: number; name: string },
  to: { lat: number; lon: number; name: string },
  courseNumber?: string,
  lakeId?: string
): RouteCoordinate[] | null {
  const IDEAL_DISTANCE = 0.8 // Erhöht auf 800m für bessere Treffer in großen Häfen
  const MAX_DISTANCE = 1.5 // Erhöht auf 1.5km
  const FALLBACK_DISTANCE = 5.0 // ~5km
  
  let bestMatch: RouteCoordinate[] | null = null
  let bestScore = Infinity
  let bestMatchType: 'ideal' | 'good' | 'fallback' | null = null
  
  for (const route of routes) {
    if (!route.coordinates || route.coordinates.length < 2) continue
    
    // Finde den Startpunkt (nächster Punkt zu 'from')
    let startIdx = -1
    let minStartDist = Infinity
    for (let i = 0; i < route.coordinates.length; i++) {
      const dist = getDistance(from.lat, from.lon, route.coordinates[i].lat, route.coordinates[i].lon)
      if (dist < minStartDist) {
        minStartDist = dist
        startIdx = i
      }
    }
    
    // Finde den Endpunkt (nächster Punkt zu 'to')
    let endIdx = -1
    let minEndDist = Infinity
    for (let i = 0; i < route.coordinates.length; i++) {
      const dist = getDistance(to.lat, to.lon, route.coordinates[i].lat, route.coordinates[i].lon)
      if (dist < minEndDist) {
        minEndDist = dist
        endIdx = i
      }
    }
    
    // Bestimme Match-Typ basierend auf Distanz
    let matchType: 'ideal' | 'good' | 'fallback' | null = null
    if (minStartDist < IDEAL_DISTANCE && minEndDist < IDEAL_DISTANCE) {
      matchType = 'ideal'
    } else if (minStartDist < MAX_DISTANCE && minEndDist < MAX_DISTANCE) {
      matchType = 'good'
    } else if (minStartDist < FALLBACK_DISTANCE && minEndDist < FALLBACK_DISTANCE) {
      matchType = 'fallback'
    }
    
    // Wenn beide Stationen nahe an der Route sind
    if (matchType && startIdx >= 0 && endIdx >= 0) {
      // Berechne die Länge des direkten Segments
      let segmentLength = 0
      const actualStart = Math.min(startIdx, endIdx)
      const actualEnd = Math.max(startIdx, endIdx)
      for (let i = actualStart; i < actualEnd; i++) {
        segmentLength += getDistance(
          route.coordinates[i].lat,
          route.coordinates[i].lon,
          route.coordinates[i + 1].lat,
          route.coordinates[i + 1].lon
        )
      }

      // Bonus für Namens-Übereinstimmung
      let nameBonus = 0
      if (route.name && from.name && to.name) {
        const routeName = route.name.toLowerCase()
        const fromName = from.name.toLowerCase()
        const toName = to.name.toLowerCase()
        
        // Seespezifische Bonuspunkte
        if (lakeId === 'zurichsee') {
          const { getZurichseeRouteBonus } = require('./lakes/zurichsee-routes')
          nameBonus += getZurichseeRouteBonus(routeName, courseNumber)
        }

        // 1. Kursnummer-Matching (z.B. "3732" in "3732: Personenfähre..." oder im ref-Feld)
        if (courseNumber) {
          const cnClean = courseNumber.replace(/^0+/, '')
          if (routeName.includes(cnClean) || (route.ref && route.ref.includes(cnClean))) {
            nameBonus += 10000 // Gigantischer Bonus für richtige Kursnummer
          }
        }

        // 2. Stationsnamen im Routennamen (z.B. "Thalwil" und "Küsnacht")
        // Wir prüfen auch ob die Reihenfolge stimmt (Thalwil kommt vor Küsnacht)
        const fromPos = routeName.indexOf(fromName)
        const toPos = routeName.indexOf(toName)
        
        if (fromPos !== -1 && toPos !== -1) {
          if (fromPos < toPos) {
            nameBonus += 5000 // Richtige Reihenfolge in der Route
          } else {
            nameBonus += 3000 // Beide drin, aber umgekehrt (Route wird später eh umgedreht)
          }
        } else if (fromPos !== -1 || toPos !== -1) {
          nameBonus += 500 // Mindestens ein Name drin
        }
      }

      // Berechne einen Score basierend auf der Distanz zu beiden Stationen
      // UND der Länge des Segments (kürzere Routen bevorzugen)
      // WICHTIG: Segment-Länge stark gewichten, um direkte Routen zu bevorzugen
      // Kürzere Routen sind fast immer besser als lange Routen mit Kursnummer-Match
      const score = (minStartDist + minEndDist) * 100 + segmentLength * 5 - nameBonus
      
      // Bevorzuge bessere Match-Typen (ideal > good > fallback)
      const typePriority = matchType === 'ideal' ? 0 : matchType === 'good' ? 1 : 2
      const currentTypePriority = bestMatchType === 'ideal' ? 0 : bestMatchType === 'good' ? 1 : 2
      
      // Wenn dieser Match besser ist als der bisherige beste Match
      if (typePriority < currentTypePriority || 
          (typePriority === currentTypePriority && score < bestScore)) {
        
        // Extrahiere den relevanten Teil der Route
        const actualStart = Math.min(startIdx, endIdx)
        const actualEnd = Math.max(startIdx, endIdx)
        const routeSegment = route.coordinates.slice(actualStart, actualEnd + 1)
        
        // Wenn startIdx > endIdx, muss die Route umgekehrt werden, 
        // da das Schiff gegen die Digitalisierungsrichtung des GeoJSON fährt
        if (startIdx > endIdx) {
          routeSegment.reverse()
        }
        
        bestMatch = routeSegment
        bestScore = score
        bestMatchType = matchType
        
        if (nameBonus > 0) {
          console.log(`🎯 Bevorzuge Route "${route.name}" für Kurs ${courseNumber || '?'} (${from.name} -> ${to.name}) - Bonus: ${nameBonus}`)
        }
      }
    }
  }
  
  if (bestMatch && bestMatchType === 'fallback') {
    console.log(`⚠️ Verwende Fallback-Route für ${from.name} -> ${to.name} (Distanz Score: ${bestScore.toFixed(3)})`)
  }
  
  if (!bestMatch) {
    // Wenn gar nichts gefunden wurde, logge die Distanz zum absolut nächsten Punkt überhaupt
    let absoluteMinDist = Infinity
    for (const route of routes) {
      for (const p of route.coordinates) {
        const d1 = getDistance(from.lat, from.lon, p.lat, p.lon)
        const d2 = getDistance(to.lat, to.lon, p.lat, p.lon)
        if (d1 + d2 < absoluteMinDist) absoluteMinDist = d1 + d2
      }
    }
    console.warn(`❌ Absolut keine Route gefunden für ${from.name} -> ${to.name}. Nächste Punkte waren ${absoluteMinDist.toFixed(3)} km entfernt.`)
  }
  
  return bestMatch
}

// Berechnet die Position entlang einer Route basierend auf Fortschritt
function getPositionAlongRoute(
  routeCoordinates: RouteCoordinate[],
  progress: number
): { lat: number; lon: number; course: number } {
  if (routeCoordinates.length === 0) {
    throw new Error('Route hat keine Koordinaten')
  }
  
  if (progress <= 0) {
    return {
      lat: routeCoordinates[0].lat,
      lon: routeCoordinates[0].lon,
      course: 0
    }
  }
  
  if (progress >= 1) {
    const last = routeCoordinates[routeCoordinates.length - 1]
    const secondLast = routeCoordinates[routeCoordinates.length - 2] || last
    const dLon = (last.lon - secondLast.lon) * Math.PI / 180
    const lat1 = secondLast.lat * Math.PI / 180
    const lat2 = last.lat * Math.PI / 180
    const y = Math.sin(dLon) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
    const course = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
    
    return {
      lat: last.lat,
      lon: last.lon,
      course
    }
  }
  
  // Berechne die Gesamtlänge der Route
  let totalDistance = 0
  const segmentDistances: number[] = []
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const dist = getDistance(
      routeCoordinates[i].lat,
      routeCoordinates[i].lon,
      routeCoordinates[i + 1].lat,
      routeCoordinates[i + 1].lon
    )
    segmentDistances.push(dist)
    totalDistance += dist
  }
  
  // Finde das Segment, in dem wir uns befinden
  const targetDistance = totalDistance * progress
  let accumulatedDistance = 0
  
  for (let i = 0; i < segmentDistances.length; i++) {
    if (accumulatedDistance + segmentDistances[i] >= targetDistance) {
      // Wir sind in diesem Segment
      const segmentProgress = (targetDistance - accumulatedDistance) / segmentDistances[i]
      const from = routeCoordinates[i]
      const to = routeCoordinates[i + 1]
      
      const lat = from.lat + (to.lat - from.lat) * segmentProgress
      const lon = from.lon + (to.lon - from.lon) * segmentProgress
      
      // Berechne Kurs basierend auf Segment-Richtung
      const dLon = (to.lon - from.lon) * Math.PI / 180
      const lat1 = from.lat * Math.PI / 180
      const lat2 = to.lat * Math.PI / 180
      const y = Math.sin(dLon) * Math.cos(lat2)
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
      const course = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
      
      return { lat, lon, course }
    }
    accumulatedDistance += segmentDistances[i]
  }
  
  // Fallback: letzter Punkt
  const last = routeCoordinates[routeCoordinates.length - 1]
  return { lat: last.lat, lon: last.lon, course: 0 }
}

// Berechnet die aktuelle Position eines Schiffs basierend auf Route und Zeit
export async function calculateShipPosition(
  route: RouteSegment[],
  currentTime: Date,
  geoJSONRoutes?: ShipRouteData[]
): Promise<ShipPosition | null> {
  if (route.length === 0) return null

  // Lade GeoJSON-Routen falls nicht übergeben
  if (!geoJSONRoutes) {
    const { getCachedGeoJSONRoutes } = await import('./geojson-routes')
    geoJSONRoutes = await getCachedGeoJSONRoutes()
  }

  // Finde das aktuelle Segment
  for (const segment of route) {
    if (currentTime >= segment.departureTime && currentTime <= segment.arrivalTime) {
      const elapsed = (currentTime.getTime() - segment.departureTime.getTime()) / 1000 / 60 // Minuten
      const totalDuration = (segment.arrivalTime.getTime() - segment.departureTime.getTime()) / 1000 / 60
      
      // Nicht-lineare Progress-Berechnung (Langsamer bei Start und Ende, schnelleres Beschleunigen/Verzögern)
      // Wir berechnen einen gewichteten Fortschritt
      let progress: number
      const D = segment.distance
      const dA = APPROACH_DISTANCE // 0.25 km (250m)
      
      if (D > 2 * dA) {
        // Zeitanteile berechnen (Annahme: Approach ist halb so schnell wie Cruising)
        // t = d / v. Wenn v_approach = 0.5 * v_cruising, dann dauert 1km Approach so lange wie 2km Cruising.
        const equivalentDistance = (D - 2 * dA) + (2 * dA * 2) // Die "zeitliche" Distanz
        const tA = (dA * 2) / equivalentDistance * totalDuration // Zeit für einen Approach-Teil
        const tC = (D - 2 * dA) / equivalentDistance * totalDuration // Zeit für Cruising-Teil
        
        if (elapsed < tA) {
          // Phase 1: Abfahrt (Beschleunigung/Langsamfahrt)
          // Quadratische Kurve für schnelleres Beschleunigen
          const normalizedTime = elapsed / tA
          const accelerationFactor = normalizedTime * normalizedTime // Quadratisch für schnelleres Beschleunigen
          progress = accelerationFactor * (dA / D)
        } else if (elapsed < tA + tC) {
          // Phase 2: Reiseflug (Konstante Geschwindigkeit)
          const cruisingElapsed = elapsed - tA
          progress = (dA / D) + (cruisingElapsed / tC) * ((D - 2 * dA) / D)
        } else {
          // Phase 3: Ankunft (Verzögerung/Langsamfahrt)
          // Quadratische Kurve für schnelleres Verzögern
          const arrivalElapsed = elapsed - (tA + tC)
          const normalizedTime = arrivalElapsed / tA
          const decelerationFactor = 1 - (1 - normalizedTime) * (1 - normalizedTime) // Umgekehrte Quadratik für schnelleres Verzögern
          progress = ((D - dA) / D) + decelerationFactor * (dA / D)
        }
      } else {
        // Wenn Strecke extrem kurz ist, einfach linear
        progress = elapsed / totalDuration
      }
      
      progress = Math.min(1, Math.max(0, progress))

      let lat: number
      let lon: number
      let course: number

      // Versuche Route aus GeoJSON zu finden
      let routeCoordinates: RouteCoordinate[] | null | undefined = segment.routeCoordinates
      
      // Wenn keine Route im Segment gespeichert ist, versuche sie zu finden
      if (!routeCoordinates && geoJSONRoutes) {
        // Seespezifische Route-Findung (z.B. für Greifensee)
        const lakeId = segment.lakeId
        
        if (lakeId === 'greifensee') {
          const { findGreifenseeRoute } = require('./lakes/greifensee-routes')
          routeCoordinates = findGreifenseeRoute(geoJSONRoutes, 
            segment.from,
            segment.to,
            segment.courseNumber
          )
        } else if (lakeId === 'aegerisee') {
          const { findAegeriseeRoute } = require('./lakes/aegerisee-routes')
          routeCoordinates = findAegeriseeRoute(geoJSONRoutes, 
            segment.from,
            segment.to,
            segment.courseNumber
          )
        }
        
        // Fallback: Allgemeine Route-Findung
        if (!routeCoordinates) {
          routeCoordinates = findRouteBetweenStations(geoJSONRoutes, segment.from, segment.to, segment.courseNumber, lakeId)

          // Wenn das nicht funktioniert, suche nach Routen, die mindestens eine der Stationen berühren
          if (!routeCoordinates) {
            routeCoordinates = findRouteNearStations(geoJSONRoutes, segment.from, segment.to, segment.courseNumber)
          }
        }

        // Wenn Route gefunden wurde, speichere sie im Segment für zukünftige Verwendung
        if (routeCoordinates && routeCoordinates.length > 1) {
          segment.routeCoordinates = routeCoordinates
        }
      }
      
      if (routeCoordinates && routeCoordinates.length > 1) {
        // Verwende die tatsächliche Route aus GeoJSON
        const position = getPositionAlongRoute(routeCoordinates, progress)
        lat = position.lat
        lon = position.lon
        course = position.course
      } else {
        // WARNUNG: Fallback sollte nicht verwendet werden, wenn GeoJSON-Routen verfügbar sind
        if (Math.random() < 0.01) { // Reduziere Log-Spam in der Schleife
          console.warn(`⚠️ FALLBACK: Keine Route gefunden für ${segment.from.name} -> ${segment.to.name}, verwende lineare Interpolation`)
          console.log(`   Koordinaten: [${segment.from.lat}, ${segment.from.lon}] -> [${segment.to.lat}, ${segment.to.lon}]`)
        }
        
        // Fallback: Lineare Interpolation zwischen Stationen
        lat = segment.from.lat + (segment.to.lat - segment.from.lat) * progress
        lon = segment.from.lon + (segment.to.lon - segment.from.lon) * progress
        
        // Berechne Kurs (Bearing)
        const dLon = (segment.to.lon - segment.from.lon) * Math.PI / 180
        const lat1 = segment.from.lat * Math.PI / 180
        const lat2 = segment.to.lat * Math.PI / 180
        const y = Math.sin(dLon) * Math.cos(lat2)
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
        course = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
      }

      // Berechne Geschwindigkeit (langsamer bei Ankunft/Abfahrt)
      const distanceToStart = getDistance(lat, lon, segment.from.lat, segment.from.lon)
      const distanceToEnd = getDistance(lat, lon, segment.to.lat, segment.to.lon)
      
      let speed = CRUISING_SPEED
      if (distanceToStart < APPROACH_DISTANCE || distanceToEnd < APPROACH_DISTANCE) {
        speed = APPROACH_SPEED
      }

      // Versuche Schiffsnamen zu ermitteln
      let shipName = segment.resolvedShipName
      
      if (!shipName) {
        // Cache-Schlüssel für Schiffsnamen (vermeidet wiederholte API-Aufrufe)
        const lookupNumber = segment.internalCourseNumber || segment.courseNumber || 'unknown'
        const shipNameCacheKey = `${lookupNumber}|${segment.departureTime.toISOString().split('T')[0]}`
        
        // Verwende einen einfachen Cache für Schiffsnamen während der Berechnung
        if (!(globalThis as any).__shipNameCache) {
          (globalThis as any).__shipNameCache = new Map<string, Promise<string | null>>()
        }
        
        const cache = (globalThis as any).__shipNameCache as Map<string, Promise<string | null>>
        
        let shipNamePromise = cache.get(shipNameCacheKey)
        if (!shipNamePromise) {
          shipNamePromise = getShipNameByCourseNumber(lookupNumber, segment.departureTime)
          cache.set(shipNameCacheKey, shipNamePromise)
          
          // Cache für 1 Stunde behalten
          setTimeout(() => {
            cache.delete(shipNameCacheKey)
          }, 60 * 60 * 1000)
        }
        
        shipName = (await shipNamePromise) || undefined
      }

      return {
        id: `ship-${segment.from.name}-${segment.to.name}-${segment.departureTime.getTime()}`,
        name: shipName || `Schiff ${segment.from.name} → ${segment.to.name}`,
        latitude: lat,
        longitude: lon,
        course,
        speed,
        nextStop: segment.to.name,
        arrivalTime: segment.arrivalTime,
        departureTime: segment.departureTime,
        fromStation: segment.from.name,
        toStation: segment.to.name,
        courseNumber: segment.courseNumber,
        internalCourseNumber: segment.internalCourseNumber,
      }
    }
  }

  // Schiff ist zwischen Routen oder noch nicht gestartet
  return null
}

function findRouteNearStations(
  routes: ShipRouteData[],
  from: { lat: number; lon: number; name: string },
  to: { lat: number; lon: number; name: string },
  courseNumber?: string
): RouteCoordinate[] | null {
  const STATION_DISTANCE = 2.0 // 2km Radius um Stationen

  let bestMatch: RouteCoordinate[] | null = null
  let bestScore = Infinity

  for (const route of routes) {
    if (!route.coordinates || route.coordinates.length < 2) continue

    // Prüfe, ob die Route mindestens eine der Stationen berührt
    let fromDistance = Infinity
    let toDistance = Infinity

    for (const coord of route.coordinates) {
      const distFrom = getDistance(from.lat, from.lon, coord.lat, coord.lon)
      const distTo = getDistance(to.lat, to.lon, coord.lat, coord.lon)

      fromDistance = Math.min(fromDistance, distFrom)
      toDistance = Math.min(toDistance, distTo)
    }

    // Wenn die Route mindestens eine Station berührt (innerhalb von STATION_DISTANCE)
    const touchesFrom = fromDistance < STATION_DISTANCE
    const touchesTo = toDistance < STATION_DISTANCE

    if (touchesFrom || touchesTo) {
      // Berechne Score basierend auf Entfernung
      let score = Math.min(fromDistance, toDistance)

      // Bonus für Routen, die beide Stationen berühren
      if (touchesFrom && touchesTo) {
        score -= 1000 // Großer Bonus
      }

      // Bonus für Namens-Übereinstimmung
      if (route.name && (from.name || to.name)) {
        const routeName = route.name.toLowerCase()
        const fromName = from.name.toLowerCase()
        const toName = to.name.toLowerCase()

        if (courseNumber) {
          const cnClean = courseNumber.replace(/^0+/, '')
          if (routeName.includes(cnClean) || (route.ref && route.ref.includes(cnClean))) {
            score -= 5000 // Bonus für Kursnummer
          }
        }

        if (routeName.includes(fromName) || routeName.includes(toName)) {
          score -= 1000 // Bonus für Stationsnamen
        }
      }

      // Bevorzuge kürzere Routen
      score += route.coordinates.length * 10

      if (score < bestScore) {
        bestScore = score
        bestMatch = route.coordinates
      }
    }
  }

  return bestMatch
}

// Konvertiert Transport API Connections zu Route Segments
export function convertConnectionsToRoute(
  connections: any[],
  stationCoordinates: Map<string, { lat: number; lon: number }>
): RouteSegment[] {
  const segments: RouteSegment[] = []

  for (const conn of connections) {
    if (!conn.sections) continue

      for (const section of conn.sections) {
        if (section.journey && section.journey.passList) {
          const passList = section.journey.passList
          // Extrahiere Kursnummer aus journey (kann in verschiedenen Feldern sein)
          // Versuche verschiedene Felder: number, name (enthält oft die Nummer), category
          let courseNumber = section.journey.number
          
          // Wenn number nicht vorhanden, versuche aus name zu extrahieren
          if (!courseNumber && section.journey.name) {
            const nameMatch = section.journey.name.match(/\d+/)
            if (nameMatch) {
              courseNumber = nameMatch[0]
            }
          }
          
          // Fallback: category als String
          if (!courseNumber && section.journey.category) {
            courseNumber = section.journey.category.toString()
          }
          
          // Debug: Logge die extrahierte Kursnummer
          if (courseNumber) {
            console.log(`  Kursnummer extrahiert: ${courseNumber} aus journey:`, {
              number: section.journey.number,
              name: section.journey.name,
              category: section.journey.category
            })
          }
        
        for (let i = 0; i < passList.length - 1; i++) {
          const from = passList[i]
          const to = passList[i + 1]
          
          // Versuche verschiedene Stationsnamen-Varianten
          let fromCoords = stationCoordinates.get(from.station.name)
          let toCoords = stationCoordinates.get(to.station.name)
          
          // Fallback: Versuche ohne "(See)" Suffix
          if (!fromCoords) {
            const nameWithoutSuffix = from.station.name.replace(' (See)', '')
            fromCoords = stationCoordinates.get(nameWithoutSuffix)
          }
          if (!toCoords) {
            const nameWithoutSuffix = to.station.name.replace(' (See)', '')
            toCoords = stationCoordinates.get(nameWithoutSuffix)
          }
          
          if (fromCoords && toCoords && from.departure && to.arrival) {
            const departureTime = new Date(from.departure)
            const arrivalTime = new Date(to.arrival)
            const distance = getDistance(fromCoords.lat, fromCoords.lon, toCoords.lat, toCoords.lon)

            segments.push({
              from: {
                lat: fromCoords.lat,
                lon: fromCoords.lon,
                name: from.station.name,
              },
              to: {
                lat: toCoords.lat,
                lon: toCoords.lon,
                name: to.station.name,
              },
              departureTime,
              arrivalTime,
              distance,
              courseNumber,
            })
          }
        }
      }
    }
  }

  return segments
}

/**
 * Erstellt Route Segments direkt aus Stationboard-Daten ohne Connections-API
 * Schätzt die Ankunftszeit basierend auf Distanz und durchschnittlicher Geschwindigkeit
 */
export function createRouteSegmentFromStationboard(
  fromStation: string,
  toStation: string,
  departureTime: Date,
  courseNumber: string | undefined,
  stationCoordinates: Map<string, { lat: number; lon: number }>,
  geoJSONRoutes: ShipRouteData[],
  manualArrivalTime?: Date,
  internalCourseNumber?: string,
  lakeId?: string
): RouteSegment | null {
  const fromCoords = stationCoordinates.get(fromStation)
  const toCoords = stationCoordinates.get(toStation)
  
  if (!fromCoords || !toCoords || fromStation === toStation) {
    return null
  }
  
  // Seespezifische Route-Findung
  let routeCoordinates: RouteCoordinate[] | null = null
  
  if (lakeId === 'aegerisee') {
    // Ägerisee: Verwende spezielle Rundfahrten-Logik
    const { findAegeriseeRoute } = require('./lakes/aegerisee-routes')
    routeCoordinates = findAegeriseeRoute(geoJSONRoutes, 
      { lat: fromCoords.lat, lon: fromCoords.lon, name: fromStation },
      { lat: toCoords.lat, lon: toCoords.lon, name: toStation },
      courseNumber
    )
  } else if (lakeId === 'greifensee') {
    // Greifensee: Verwende spezielle Rundfahrten-Logik
    const { findGreifenseeRoute } = require('./lakes/greifensee-routes')
    routeCoordinates = findGreifenseeRoute(geoJSONRoutes, 
      { lat: fromCoords.lat, lon: fromCoords.lon, name: fromStation },
      { lat: toCoords.lat, lon: toCoords.lon, name: toStation },
      courseNumber
    )
  }
  
  // Fallback: Allgemeine Route-Findung
  if (!routeCoordinates) {
    routeCoordinates = findRouteBetweenStations(geoJSONRoutes, 
      { lat: fromCoords.lat, lon: fromCoords.lon, name: fromStation },
      { lat: toCoords.lat, lon: toCoords.lon, name: toStation },
      courseNumber,
      lakeId
    )
  }
  
  if (!routeCoordinates || routeCoordinates.length < 2) {
    // Seespezifische Debug-Logik
    let shouldDebug = geoJSONRoutes.length === 0
    
    if (lakeId === 'aegerisee') {
      const { shouldDebugAegeriseeRoute } = require('./lakes/aegerisee-routes')
      if (shouldDebugAegeriseeRoute(fromStation, toStation)) {
        shouldDebug = true
        console.warn(`⚠️ Keine GeoJSON-Route gefunden für ${fromStation} -> ${toStation} (Kurs ${courseNumber})`)
        console.log(`   Von Station: ${fromStation} (${fromCoords.lat.toFixed(6)}, ${fromCoords.lon.toFixed(6)})`)
        console.log(`   Zu Station: ${toStation} (${toCoords.lat.toFixed(6)}, ${toCoords.lon.toFixed(6)})`)
        console.log(`   Verfügbare Routen: ${geoJSONRoutes.length}`)
      }
    } else if (lakeId === 'greifensee') {
      const { shouldDebugGreifenseeRoute } = require('./lakes/greifensee-routes')
      if (shouldDebugGreifenseeRoute(fromStation, toStation)) {
        shouldDebug = true
        console.warn(`⚠️ Keine GeoJSON-Route gefunden für ${fromStation} -> ${toStation} (Kurs ${courseNumber})`)
        console.log(`   Von Station: ${fromStation} (${fromCoords.lat.toFixed(6)}, ${fromCoords.lon.toFixed(6)})`)
        console.log(`   Zu Station: ${toStation} (${toCoords.lat.toFixed(6)}, ${toCoords.lon.toFixed(6)})`)
        console.log(`   Verfügbare Routen: ${geoJSONRoutes.length}`)
      }
    }
    
    if (lakeId === 'zurichsee') {
      const { shouldDebugZurichseeRoute } = require('./lakes/zurichsee-routes')
      if (shouldDebugZurichseeRoute(courseNumber, internalCourseNumber)) {
        shouldDebug = true
      }
    }
    
    // Log nur bei seespezifischen Debug-Fällen oder wenn es wirklich keine Routen gibt
    if (shouldDebug) {
      
      if (geoJSONRoutes.length === 0) {
        console.error(`   ❌ KEINE ROUTEN GELADEN! Prüfe ob GeoJSON korrekt geladen wird.`)
      } else {
        // Debug: Zeige die besten Matches
        const matches: Array<{ route: ShipRouteData; fromDist: number; toDist: number; score: number }> = []
        
        for (const route of geoJSONRoutes) {
          if (!route.coordinates || route.coordinates.length < 2) continue
          
          let minFromDist = Infinity
          let minToDist = Infinity
          
          for (const point of route.coordinates) {
            const fromDist = getDistance(fromCoords.lat, fromCoords.lon, point.lat, point.lon)
            const toDist = getDistance(toCoords.lat, toCoords.lon, point.lat, point.lon)
            if (fromDist < minFromDist) minFromDist = fromDist
            if (toDist < minToDist) minToDist = toDist
          }
          
          matches.push({
            route,
            fromDist: minFromDist,
            toDist: minToDist,
            score: minFromDist + minToDist
          })
        }
        
        matches.sort((a, b) => a.score - b.score)
        console.log(`   Beste Matches (Top 5):`)
        for (let i = 0; i < Math.min(5, matches.length); i++) {
          const match = matches[i]
          console.log(`   ${i + 1}. ${match.route.name || 'Unbenannt'}: ${match.fromDist.toFixed(3)}km + ${match.toDist.toFixed(3)}km = ${match.score.toFixed(3)}km`)
        }
      }
    }
  } else {
    // Seespezifische Success-Logs
    if (lakeId === 'zurichsee') {
      const { shouldDebugZurichseeRoute } = require('./lakes/zurichsee-routes')
      if (shouldDebugZurichseeRoute(courseNumber, internalCourseNumber)) {
        console.log(`✅ GeoJSON-Route gefunden für ${fromStation} -> ${toStation} (Kurs ${courseNumber}): ${routeCoordinates.length} Punkte`)
      }
    }
  }
  
  // Berechne Distanz
  let distance: number
  if (routeCoordinates && routeCoordinates.length > 1) {
    // Berechne Gesamtdistanz entlang der Route
    distance = 0
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      distance += getDistance(
        routeCoordinates[i].lat,
        routeCoordinates[i].lon,
        routeCoordinates[i + 1].lat,
        routeCoordinates[i + 1].lon
      )
    }
  } else {
    // Fallback: Direkte Distanz
    distance = getDistance(fromCoords.lat, fromCoords.lon, toCoords.lat, toCoords.lon)
    console.warn(`⚠️ Verwende direkte Distanz (keine Route gefunden): ${distance.toFixed(2)} km`)
  }
  
  // Schätze Ankunftszeit basierend auf Distanz und durchschnittlicher Geschwindigkeit
  // Berücksichtige langsamere Geschwindigkeit bei Ankunft/Abfahrt
  let arrivalTime: Date
  if (manualArrivalTime) {
    arrivalTime = manualArrivalTime
  } else {
    const approachTime = APPROACH_DISTANCE / (APPROACH_SPEED * 1.852) // Knoten zu km/h
    const cruisingTime = Math.max(0, (distance - APPROACH_DISTANCE * 2) / AVERAGE_SPEED_KMH)
    const totalHours = approachTime * 2 + cruisingTime
    arrivalTime = new Date(departureTime.getTime() + totalHours * 60 * 60 * 1000)
  }
  
  return {
    from: {
      lat: fromCoords.lat,
      lon: fromCoords.lon,
      name: fromStation,
    },
    to: {
      lat: toCoords.lat,
      lon: toCoords.lon,
      name: toStation,
    },
    departureTime,
    arrivalTime,
    distance,
    courseNumber,
    internalCourseNumber,
    routeCoordinates: routeCoordinates || undefined,
    lakeId, // Speichere lakeId für spätere Verwendung in calculateShipPosition
  }
}
