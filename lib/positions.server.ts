import { loadRoutesFromFile } from './geojson-routes.server'
import { getConnectedLakes, getStationCoordinates, LAKES, loadLakeData } from './lakes-config'
import { buildDailySegments, computePositions, type ScheduleSegment, zurichDate } from './positions'
import { getShipNameByCourseNumber } from './ship-names-api'
import type { ShipPosition } from './ship-position'
import { getAllStationsStationboard } from './transport-api'

export interface ApiShip {
  name: string
  /** Course number without letters and leading zeros, e.g. «7». */
  course: string
  lat: number
  lon: number
  /** Bearing in degrees, 0 = north. */
  heading: number
  from: string
  /** Final destination of the journey. */
  to: string
  nextStop: string
  departure: string | null
  /** Arrival at the next stop. */
  arrival: string | null
  /** Arrival at the final destination. */
  destinationArrival: string | null
}

const SCHEDULE_TTL_MS = 6 * 60 * 60_000
const POSITIONS_TTL_MS = 30_000

const shortCourse = (p: ShipPosition) => (p.internalCourseNumber || p.officialCourseNumber || p.courseNumber || '').match(/\d+/)?.[0]?.replace(/^0+/, '') || ''

export function toApiShips(positions: ShipPosition[]): ApiShip[] {
  return positions
    .filter((p) => p.status === 'driving')
    .map((p) => ({
      name: p.name,
      course: shortCourse(p),
      lat: p.latitude,
      lon: p.longitude,
      heading: p.course,
      from: p.fromStation ?? '',
      to: p.destination ?? p.toStation ?? '',
      nextStop: p.toStation ?? p.nextStop,
      departure: p.departureTime ? p.departureTime.toISOString() : null,
      arrival: p.arrivalTime ? p.arrivalTime.toISOString() : null,
      destinationArrival: p.destinationArrival ? p.destinationArrival.toISOString() : null,
    }))
}

export function nextDeparture(segments: { segment: ScheduleSegment }[], now: Date): { time: string; station: string } | null {
  let best: ScheduleSegment | null = null
  for (const { segment } of segments) {
    if (segment.departureTime.getTime() > now.getTime() && (!best || segment.departureTime < best.departureTime)) best = segment
  }
  return best ? { time: best.departureTime.toISOString(), station: best.from.name } : null
}

interface Schedule {
  segments: { segment: ScheduleSegment }[]
  geoRoutes: Awaited<ReturnType<typeof loadRoutesFromFile>>
}

const schedules = new Map<string, { at: number; schedule: Promise<Schedule> }>()
const positions = new Map<string, { at: number; result: ReturnType<typeof getLakePositions> }>()

const entryCount = (boards: Map<string, unknown[]>) => Array.from(boards.values()).reduce((n, e) => n + e.length, 0)

async function loadSchedule(lakeId: string, date: string): Promise<Schedule> {
  const lakeIds = getConnectedLakes(lakeId)
  const lakeData = await Promise.all(lakeIds.map((id) => loadLakeData(id)))
  const stations = lakeData.flatMap((d) => d.stations)
  const mapping = Object.assign({}, ...lakeData.map((d) => d.mapping)) as Record<string, string>
  const geoRoutes = (await Promise.all(lakeIds.map((id) => loadRoutesFromFile(LAKES[id]!.geojsonPath)))).flat()
  const ids = stations.map((s) => s.uic_ref || s.name)
  // transport.opendata.ch errors come back as empty boards (and stay cached): ask once past the cache, then fail.
  let stationboards = await getAllStationsStationboard(ids, date, '00:00')
  if (entryCount(stationboards) === 0) stationboards = await getAllStationsStationboard(ids, date, '00:00', true)
  if (entryCount(stationboards) === 0) throw new Error(`Fahrplan leer für ${lakeId} am ${date}`)
  // Noon UTC of the Zurich date, so the name lookup (toISOString) asks for the right day.
  const day = new Date(`${date}T12:00:00Z`)
  const segments = await buildDailySegments({
    stationboards,
    mapping,
    stationCoords: getStationCoordinates(stations),
    geoRoutes,
    lakeId,
    shipNameFor: (course) => (LAKES[lakeId]!.hasShipNames ? getShipNameByCourseNumber(course, day) : Promise.resolve(null)),
  })
  return { segments, geoRoutes }
}

function schedule(lakeId: string, date: string): Promise<Schedule> {
  const key = `${lakeId}|${date}`
  const hit = schedules.get(key)
  if (hit && Date.now() - hit.at < SCHEDULE_TTL_MS) return hit.schedule
  const loading = loadSchedule(lakeId, date)
  schedules.set(key, { at: Date.now(), schedule: loading })
  loading.catch(() => schedules.delete(key))
  return loading
}

/** Ships sailing now on a lake, cached 30 s; the day's timetable is built once per 6 h. */
export function getLakePositions(lakeId: string, now = new Date()): Promise<{ updatedAt: string; ships: ApiShip[]; nextDeparture: { time: string; station: string } | null }> {
  const hit = positions.get(lakeId)
  if (hit && now.getTime() - hit.at < POSITIONS_TTL_MS) return hit.result
  const result = schedule(lakeId, zurichDate(now)).then(async ({ segments, geoRoutes }) => ({
    updatedAt: now.toISOString(),
    ships: toApiShips(await computePositions(segments, geoRoutes, now)),
    nextDeparture: nextDeparture(segments, now),
  }))
  positions.set(lakeId, { at: now.getTime(), result })
  result.catch(() => positions.delete(lakeId))
  return result
}
