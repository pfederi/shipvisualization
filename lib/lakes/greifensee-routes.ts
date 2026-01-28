import { ShipRouteData, RouteCoordinate } from '../geojson-routes'

/**
 * Greifensee-spezifische Route-Findung
 * Die Schifffahrt auf dem Greifensee folgt einer Rundfahrt im Uhrzeigersinn:
 * Maur → Fällanden → Greifensee → Uster → Mönchaltorf → zurück nach Maur
 */

// Haversine-Formel für Distanzberechnung (in km)
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

export function shouldDebugGreifenseeRoute(
  fromStation: string,
  toStation: string
): boolean {
  // Debug für kritische Routen (z.B. über das Ende) und Uster ↔ Maur
  return (fromStation.includes('Mönchaltorf') && toStation.includes('Maur')) || 
         (fromStation.includes('Maur') && toStation.includes('Fällanden')) ||
         (fromStation.includes('Uster') && toStation.includes('Maur')) ||
         (fromStation.includes('Maur') && toStation.includes('Uster'))
}

export function findGreifenseeRoute(
  routes: ShipRouteData[],
  from: { lat: number; lon: number; name: string },
  to: { lat: number; lon: number; name: string },
  courseNumber?: string
): RouteCoordinate[] | null {
  // Spezialfall: Direkte Route zwischen Uster und Maur (Kursschiff)
  // Prüfe ob es eine direkte Route gibt (z.B. BAT)
  const isUsterMaur = (from.name.includes('Uster') && to.name.includes('Maur')) ||
                       (from.name.includes('Maur') && to.name.includes('Uster'))
  
  if (isUsterMaur) {
    // Suche nach direkter Route zwischen Uster und Maur
    // Prüfe alle BAT-Routen und finde die, die nahe an beiden Stationen ist
    const MAX_STATION_DISTANCE = 0.5 // 500m
    
    let bestRoute: ShipRouteData | null = null
    let bestScore = Infinity
    
    for (const route of routes) {
      // Suche nach BAT-Routen oder Routen mit "Kurs" im Namen
      if ((route.ref === 'BAT' || 
           (route.name?.toLowerCase().includes('kurs') && !route.name?.toLowerCase().includes('rundfahrt'))) &&
          route.coordinates && route.coordinates.length >= 2) {
        
        // Finde die nächsten Punkte zu beiden Stationen
        let minStartDist = Infinity
        let minEndDist = Infinity
        
        for (let i = 0; i < route.coordinates.length; i++) {
          const distFrom = getDistance(from.lat, from.lon, route.coordinates[i].lat, route.coordinates[i].lon)
          const distTo = getDistance(to.lat, to.lon, route.coordinates[i].lat, route.coordinates[i].lon)
          
          if (distFrom < minStartDist) {
            minStartDist = distFrom
          }
          if (distTo < minEndDist) {
            minEndDist = distTo
          }
        }
        
        // Prüfe, ob beide Stationen nahe genug sind
        if (minStartDist < MAX_STATION_DISTANCE && minEndDist < MAX_STATION_DISTANCE) {
          // Score: Summe der Distanzen (niedriger ist besser)
          const score = minStartDist + minEndDist
          if (score < bestScore) {
            bestScore = score
            bestRoute = route
          }
        }
      }
    }
    
    if (bestRoute) {
      // Finde die genauen Indizes für die beste Route
      let startIdx = -1
      let minStartDist = Infinity
      for (let i = 0; i < bestRoute.coordinates.length; i++) {
        const dist = getDistance(from.lat, from.lon, bestRoute.coordinates[i].lat, bestRoute.coordinates[i].lon)
        if (dist < minStartDist) {
          minStartDist = dist
          startIdx = i
        }
      }

      let endIdx = -1
      let minEndDist = Infinity
      for (let i = 0; i < bestRoute.coordinates.length; i++) {
        const dist = getDistance(to.lat, to.lon, bestRoute.coordinates[i].lat, bestRoute.coordinates[i].lon)
        if (dist < minEndDist) {
          minEndDist = dist
          endIdx = i
        }
      }

      if (shouldDebugGreifenseeRoute(from.name, to.name)) {
        console.log(`🗺️ Greifensee: Gefundene direkte Route (${bestRoute.ref || 'BAT'}, ${bestRoute.name || 'N/A'}) für ${from.name} -> ${to.name}`)
        console.log(`   Route hat ${bestRoute.coordinates.length} Punkte`)
        console.log(`   Start-Index: ${startIdx}, Distanz: ${(minStartDist * 1000).toFixed(0)}m`)
        console.log(`   Ende-Index: ${endIdx}, Distanz: ${(minEndDist * 1000).toFixed(0)}m`)
      }

      // Verwende die direkte Route
      // Für sehr kurze Routen (2 Punkte): Verwende die gesamte Route
      let routeSegment: RouteCoordinate[]
      if (bestRoute.coordinates.length === 2) {
        // Direkte Route mit nur 2 Punkten: Prüfe Richtung basierend auf Stationen
        const distToFirst = getDistance(from.lat, from.lon, bestRoute.coordinates[0].lat, bestRoute.coordinates[0].lon)
        const distToLast = getDistance(from.lat, from.lon, bestRoute.coordinates[1].lat, bestRoute.coordinates[1].lon)
        
        if (distToFirst < distToLast) {
          // Start ist näher am ersten Punkt
          routeSegment = bestRoute.coordinates
        } else {
          // Start ist näher am letzten Punkt - Route umkehren
          routeSegment = [...bestRoute.coordinates].reverse()
        }
      } else {
        // Route mit mehreren Punkten: Verwende Segment
        if (startIdx <= endIdx) {
          routeSegment = bestRoute.coordinates.slice(startIdx, endIdx + 1)
        } else {
          // Route in umgekehrter Richtung
          routeSegment = bestRoute.coordinates.slice(endIdx, startIdx + 1).reverse()
        }
      }
      
      if (shouldDebugGreifenseeRoute(from.name, to.name)) {
        console.log(`   ✅ Verwende Route-Segment mit ${routeSegment.length} Punkten`)
      }
      
      if (routeSegment.length >= 2) {
        return routeSegment
      }
    } else if (shouldDebugGreifenseeRoute(from.name, to.name)) {
      console.warn(`⚠️ Greifensee: Keine direkte Route zwischen ${from.name} und ${to.name} gefunden`)
      console.log(`   Verfügbare Routen: ${routes.length}`)
      routes.forEach((r, i) => {
        if (r.ref === 'BAT' || r.name?.toLowerCase().includes('kurs')) {
          console.log(`   Route ${i}: ref=${r.ref}, name=${r.name}, points=${r.coordinates?.length || 0}`)
        }
      })
    }
  }

  // Greifensee: Es gibt die "Greifensee Rundffahrt" (ref: SGG)
  // Alle Schiffe fahren diese Route von Station zu Station im Uhrzeigersinn
  
  const rundfahrt = routes.find(r => 
    (r.name?.includes('Rundffahrt') || r.name?.includes('Rundfahrt')) ||
    r.ref === 'SGG' ||
    (r.name?.includes('Greifensee') && r.ref?.includes('SGG'))
  )

  if (!rundfahrt || !rundfahrt.coordinates || rundfahrt.coordinates.length < 2) {
    console.warn(`⚠️ Greifensee: Keine Rundfahrt-Route gefunden. Verfügbare Routen: ${routes.length}`)
    return null
  }

  const route = rundfahrt
  const MAX_STATION_DISTANCE = 0.5 // 500m maximale Distanz zur Station

  // Finde die nächsten Punkte zu beiden Stationen
  let startIdx = -1
  let minStartDist = Infinity
  for (let i = 0; i < route.coordinates.length; i++) {
    const dist = getDistance(from.lat, from.lon, route.coordinates[i].lat, route.coordinates[i].lon)
    if (dist < minStartDist) {
      minStartDist = dist
      startIdx = i
    }
  }

  let endIdx = -1
  let minEndDist = Infinity
  for (let i = 0; i < route.coordinates.length; i++) {
    const dist = getDistance(to.lat, to.lon, route.coordinates[i].lat, route.coordinates[i].lon)
    if (dist < minEndDist) {
      minEndDist = dist
      endIdx = i
    }
  }

  // Debug-Logging (nur wenn Debug aktiviert)
  if (shouldDebugGreifenseeRoute(from.name, to.name)) {
    console.log(`🗺️ Greifensee Route: ${from.name} -> ${to.name}`)
    console.log(`   Start: ${from.name} (${from.lat.toFixed(6)}, ${from.lon.toFixed(6)}) - Nächster Punkt: Index ${startIdx}, Distanz: ${(minStartDist * 1000).toFixed(0)}m`)
    console.log(`   Ziel: ${to.name} (${to.lat.toFixed(6)}, ${to.lon.toFixed(6)}) - Nächster Punkt: Index ${endIdx}, Distanz: ${(minEndDist * 1000).toFixed(0)}m`)
  }

  if (startIdx < 0 || endIdx < 0) {
    console.warn(`⚠️ Greifensee: Konnte keine passenden Indizes finden`)
    return null
  }

  // Prüfe, ob die Distanzen zu groß sind
  if (minStartDist > MAX_STATION_DISTANCE) {
    console.warn(`⚠️ Greifensee: Start-Station ${from.name} ist zu weit von der Route entfernt (${(minStartDist * 1000).toFixed(0)}m > ${MAX_STATION_DISTANCE * 1000}m)`)
  }
  if (minEndDist > MAX_STATION_DISTANCE) {
    console.warn(`⚠️ Greifensee: Ziel-Station ${to.name} ist zu weit von der Route entfernt (${(minEndDist * 1000).toFixed(0)}m > ${MAX_STATION_DISTANCE * 1000}m)`)
  }

  // Für Uster ↔ Maur: Wähle das kürzere Segment (nicht über Mönchaltorf)
  // Uster ist bei Index 59, Maur bei Index 107
  // Direkt: 107 - 59 = 48 Punkte
  // Über das Ende: (134 - 107) + 59 = 86 Punkte
  // → Verwende direktes Segment für kürzere Route
  let routeSegment: RouteCoordinate[]
  
  if (isUsterMaur) {
    // Für Uster ↔ Maur: Immer das kürzere Segment verwenden
    const directLength = Math.abs(endIdx - startIdx)
    const wrapLength = route.coordinates.length - Math.max(startIdx, endIdx) + Math.min(startIdx, endIdx)
    
    if (directLength <= wrapLength) {
      // Direktes Segment ist kürzer
      if (startIdx <= endIdx) {
        routeSegment = route.coordinates.slice(startIdx, endIdx + 1)
      } else {
        routeSegment = route.coordinates.slice(endIdx, startIdx + 1).reverse()
      }
    } else {
      // Über das Ende ist kürzer
      if (startIdx > endIdx) {
        routeSegment = [...route.coordinates.slice(startIdx), ...route.coordinates.slice(0, endIdx + 1)]
      } else {
        routeSegment = [...route.coordinates.slice(endIdx), ...route.coordinates.slice(0, startIdx + 1)].reverse()
      }
    }
    
    if (shouldDebugGreifenseeRoute(from.name, to.name)) {
      console.log(`   ✅ Direkte Route Uster ↔ Maur: Segment von Index ${startIdx} bis ${endIdx} (${routeSegment.length} Punkte)`)
    }
  } else {
    // Für andere Routen: Normale Logik
    if (startIdx <= endIdx) {
      // Normale Richtung: Von startIdx bis endIdx
      routeSegment = route.coordinates.slice(startIdx, endIdx + 1)
      if (shouldDebugGreifenseeRoute(from.name, to.name)) {
        console.log(`   ✅ Normale Richtung: Segment von Index ${startIdx} bis ${endIdx} (${routeSegment.length} Punkte)`)
      }
    } else {
      // Über das Ende: Von startIdx bis Ende + Anfang bis endIdx
      routeSegment = [...route.coordinates.slice(startIdx), ...route.coordinates.slice(0, endIdx + 1)]
      if (shouldDebugGreifenseeRoute(from.name, to.name)) {
        console.log(`   ✅ Über das Ende: Segment von Index ${startIdx} bis Ende + Anfang bis ${endIdx} (${routeSegment.length} Punkte)`)
      }
    }
  }

  if (routeSegment.length < 2) {
    console.warn(`⚠️ Greifensee: Route-Segment hat zu wenige Punkte (${routeSegment.length})`)
    return null
  }

  return routeSegment
}
