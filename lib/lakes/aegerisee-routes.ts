import { ShipRouteData, RouteCoordinate } from '../geojson-routes'

/**
 * Ägerisee-spezifische Route-Findung
 * Alle Fahrten auf dem Ägerisee sind Teil der "Grossen Rundfahrt" (3661)
 */

export function shouldDebugAegeriseeRoute(
  fromStation: string,
  toStation: string
): boolean {
  return (fromStation.includes('Morgarten') && toStation.includes('Naas')) || 
         (fromStation.includes('Naas') && toStation.includes('Morgarten'))
}
export function findAegeriseeRoute(
  routes: ShipRouteData[],
  from: { lat: number; lon: number; name: string },
  to: { lat: number; lon: number; name: string },
  courseNumber?: string
): RouteCoordinate[] | null {
  // Ägerisee: Es gibt nur die "Grosse Rundfahrt" im Uhrzeigersinn
  // Alle Schiffe fahren diese Route von Station zu Station
  
  const grosseRundfahrt = routes.find(r => 
    r.name?.includes('3661') || 
    r.name?.includes('Grosse Rundfahrt') ||
    r.ref === '3661'
  )

  if (!grosseRundfahrt || !grosseRundfahrt.coordinates || grosseRundfahrt.coordinates.length < 2) {
    return null
  }

  const route = grosseRundfahrt

  // Finde die nächsten Punkte zu beiden Stationen
  let startIdx = -1
  let minStartDist = Infinity
  for (let i = 0; i < route.coordinates.length; i++) {
    const dist = Math.sqrt(
      Math.pow(from.lat - route.coordinates[i].lat, 2) +
      Math.pow(from.lon - route.coordinates[i].lon, 2)
    )
    if (dist < minStartDist) {
      minStartDist = dist
      startIdx = i
    }
  }

  let endIdx = -1
  let minEndDist = Infinity
  for (let i = 0; i < route.coordinates.length; i++) {
    const dist = Math.sqrt(
      Math.pow(to.lat - route.coordinates[i].lat, 2) +
      Math.pow(to.lon - route.coordinates[i].lon, 2)
    )
    if (dist < minEndDist) {
      minEndDist = dist
      endIdx = i
    }
  }

  if (startIdx < 0 || endIdx < 0) {
    return null
  }

  // Einfach: Folge der Rundfahrt im Uhrzeigersinn von Start zu Ziel
  // Wenn startIdx > endIdx → "über das Ende herum"
  let routeSegment: RouteCoordinate[]
  
  if (startIdx <= endIdx) {
    routeSegment = route.coordinates.slice(startIdx, endIdx + 1)
  } else {
    // Über das Ende: Von startIdx bis Ende + Anfang bis endIdx
    routeSegment = [...route.coordinates.slice(startIdx), ...route.coordinates.slice(0, endIdx + 1)]
  }

  return routeSegment.length >= 2 ? routeSegment : null
}
