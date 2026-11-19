import { calculateShipPosition, createRouteSegmentFromStationboard, type RouteSegment, type ShipPosition } from './ship-position'
import { normalizeStationName } from './lakes-config'
import type { ShipRouteData } from './geojson-routes'
import type { StationboardEntry } from './transport-api'

/** Ships coming from the yard wait this long at the first station. */
export const PRE_DEPARTURE_DWELL_MS = 60_000
/** Segments of a ship are linked, so no grace after arrival. */
export const POST_ARRIVAL_GRACE_MS = 0

const ZURICH_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' })

/** «YYYY-MM-DD» of the timetable day in Zurich (toISOString() is UTC and gives the previous day after midnight). */
export function zurichDate(d: Date): string {
  return ZURICH_DATE.format(d)
}

export type ScheduleSegment = RouteSegment & {
  arrivalAtFromStation: Date
  resolvedShipName: string
  internalCourseNumber: string
  officialCourseNumber: string
  destination: string
  /** Arrival at the final destination (last stop of the journey). */
  destinationArrival: Date | null
}

export interface DailySegmentsInput {
  stationboards: Map<string, StationboardEntry[]>
  mapping: Record<string, string>
  stationCoords: Map<string, { lat: number; lon: number }>
  geoRoutes: ShipRouteData[]
  lakeId: string
  /** Ship name for a course number (short, e.g. «29»); null: «Schiff». */
  shipNameFor: (internalCourse: string) => Promise<string | null>
}

/** All legs of the day from the stationboards: deduplicated, and linked per ship. */
export async function buildDailySegments(input: DailySegmentsInput): Promise<{ segment: ScheduleSegment }[]> {
  const { stationboards, mapping, stationCoords, geoRoutes, lakeId } = input
  const processed: { segment: ScheduleSegment }[] = []
  for (const entries of stationboards.values()) {
    for (const entry of entries) {
      if (!entry.name || !entry.passList || entry.passList.length < 2) continue
      const internalNumRaw = entry.name.match(/\d+/)?.[0] || '0'
      const internalNumShort = internalNumRaw.replace(/^0+/, '') || '0'
      const officialNumRaw = entry.number || internalNumRaw
      const officialNumShort = officialNumRaw.replace(/^0+/, '') || internalNumShort
      const displayName = (await input.shipNameFor(internalNumShort)) || 'Schiff'
      const mainStation = normalizeStationName(entry.stop.station.name, mapping)
      const lastArrival = entry.passList[entry.passList.length - 1]!.arrival
      const destTime = lastArrival ? new Date(lastArrival) : null
      const destinationArrival = destTime && !isNaN(destTime.getTime()) ? destTime : null
      for (let i = 0; i < entry.passList.length - 1; i++) {
        const currentPass = entry.passList[i]!
        const fromName = normalizeStationName(currentPass.station?.name || '', mapping) || mainStation
        if (!fromName) continue
        // API quirk: a stop can appear several times in a row; take its first time.
        let lastSame = i
        let bestDeparture: string | null = currentPass.departure || currentPass.arrival || null
        while (lastSame + 1 < entry.passList.length && normalizeStationName(entry.passList[lastSame + 1]!.station?.name || '', mapping) === fromName) {
          lastSame++
          if (!bestDeparture) bestDeparture = entry.passList[lastSame]!.departure || entry.passList[lastSame]!.arrival || null
        }
        if (!bestDeparture && fromName === mainStation) bestDeparture = entry.stop.departure || entry.stop.arrival || null
        if (!bestDeparture && currentPass.arrival) bestDeparture = currentPass.arrival
        if (!bestDeparture) {
          i = lastSame
          continue
        }
        const targetIdx = lastSame + 1
        if (targetIdx >= entry.passList.length) break
        const to = entry.passList[targetIdx]!
        const bestArrival = to.arrival || to.departure || null
        if (!to.station?.name || !bestArrival) {
          i = lastSame
          continue
        }
        const depTime = new Date(bestDeparture)
        if (isNaN(depTime.getTime())) {
          i = lastSame
          continue
        }
        let arrTime = new Date(bestArrival)
        if (isNaN(arrTime.getTime()) || arrTime <= depTime) arrTime = new Date(depTime.getTime() + 5 * 60_000)
        const toName = normalizeStationName(to.station.name, mapping)
        const segment = createRouteSegmentFromStationboard(fromName, toName, depTime, officialNumShort, stationCoords, geoRoutes, arrTime, internalNumShort, lakeId)
        if (segment) {
          let arrivalAtFrom: Date | undefined
          for (let j = 0; j < i; j++) {
            const prev = entry.passList[j]!
            if (normalizeStationName(prev.station?.name || '', mapping) === fromName && prev.arrival) {
              const prevArrival = new Date(prev.arrival)
              if (prevArrival.getTime() < depTime.getTime()) arrivalAtFrom = prevArrival
            }
          }
          processed.push({
            segment: {
              ...segment,
              arrivalAtFromStation: arrivalAtFrom ?? new Date(depTime.getTime() - PRE_DEPARTURE_DWELL_MS),
              resolvedShipName: displayName,
              internalCourseNumber: entry.name,
              officialCourseNumber: entry.number,
              destination: normalizeStationName(entry.to, mapping) || entry.to,
              destinationArrival,
            },
          })
        }
        i = lastSame
      }
    }
  }
  // Every journey appears on the board of each station it calls at: keep one, preferably with route coordinates.
  const unique = new Map<string, { segment: ScheduleSegment }>()
  for (const s of processed) {
    const dep = Math.round(s.segment.departureTime.getTime() / 60_000)
    const arr = Math.round(s.segment.arrivalTime.getTime() / 60_000)
    const key = `${s.segment.from.name}|${s.segment.to.name}|${dep}|${arr}`
    const existing = unique.get(key)
    if (!existing || (s.segment.routeCoordinates && !existing.segment.routeCoordinates)) unique.set(key, s)
  }
  const finalSegments = Array.from(unique.values())
  // Link the legs of a ship: it waits at a station from its arrival there.
  const byShip = new Map<string, { segment: ScheduleSegment }[]>()
  for (const s of finalSegments) {
    const key = s.segment.resolvedShipName || s.segment.internalCourseNumber || s.segment.officialCourseNumber
    byShip.set(key, [...(byShip.get(key) ?? []), s])
  }
  for (const segs of byShip.values()) {
    segs.sort((x, y) => x.segment.departureTime.getTime() - y.segment.departureTime.getTime())
    for (let i = 0; i < segs.length - 1; i++) {
      if (segs[i]!.segment.to.name === segs[i + 1]!.segment.from.name) segs[i + 1]!.segment.arrivalAtFromStation = segs[i]!.segment.arrivalTime
    }
  }
  return finalSegments.sort((x, y) => x.segment.departureTime.getTime() - y.segment.departureTime.getTime())
}

/** Where every ship is at `now`: waiting at a station or sailing; one position per ship. */
export async function computePositions(routeSegments: { segment: ScheduleSegment }[], geoRoutes: ShipRouteData[], now: Date): Promise<ShipPosition[]> {
  const nowTime = now.getTime()
  const results = await Promise.all(
    routeSegments.map(async ({ segment }): Promise<ShipPosition | null> => {
      const { from, to, departureTime, arrivalTime, arrivalAtFromStation, resolvedShipName, internalCourseNumber, officialCourseNumber, destination, destinationArrival } = segment
      const id = `ship-${internalCourseNumber}-${departureTime.getTime()}`
      const depTime = departureTime.getTime()
      const arrTime = arrivalTime.getTime()
      const startDwell = arrivalAtFromStation ? arrivalAtFromStation.getTime() : depTime - PRE_DEPARTURE_DWELL_MS
      const common = { id, name: resolvedShipName, departureTime, arrivalTime, fromStation: from.name, toStation: to.name, internalCourseNumber, officialCourseNumber, destination, destinationArrival }
      if (nowTime >= startDwell && nowTime < depTime) {
        return { ...common, latitude: from.lat, longitude: from.lon, course: 0, speed: 0, nextStop: to.name, status: 'at_station' } as ShipPosition
      }
      if (nowTime >= depTime && nowTime < arrTime) {
        const pos = await calculateShipPosition([segment], now, geoRoutes)
        return pos ? ({ ...pos, ...common, status: 'driving' } as ShipPosition) : null
      }
      if (nowTime >= arrTime && nowTime < arrTime + POST_ARRIVAL_GRACE_MS) {
        return { ...common, latitude: to.lat, longitude: to.lon, course: 0, speed: 0, nextStop: 'Angekommen', status: 'at_station' } as ShipPosition
      }
      return null
    }),
  )
  const finalMap = new Map<string, ShipPosition>()
  for (const p of results) {
    if (!p) continue
    const key = `${p.name}|${p.internalCourseNumber || p.officialCourseNumber || p.courseNumber || ''}`
    const existing = finalMap.get(key)
    if (!existing) {
      finalMap.set(key, p)
      continue
    }
    if (p.status === 'driving' && existing.status === 'at_station') {
      finalMap.set(key, p)
      continue
    }
    if (existing.status === 'driving' && p.status === 'at_station') continue
    if (p.status === 'at_station' && existing.status === 'at_station') {
      const distance = (s: ShipPosition) => Math.min(Math.abs(nowTime - (s.departureTime?.getTime() || 0)), Math.abs(nowTime - (s.arrivalTime?.getTime() || 0)))
      if (distance(p) < distance(existing)) finalMap.set(key, p)
      continue
    }
    if (p.departureTime && existing.departureTime && p.departureTime.getTime() > existing.departureTime.getTime()) finalMap.set(key, p)
  }
  return Array.from(finalMap.values()).sort((x, y) => (x.departureTime?.getTime() ?? Infinity) - (y.departureTime?.getTime() ?? Infinity))
}
