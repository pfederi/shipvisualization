import { loadRoutesFromFile } from './geojson-routes.server'
import { getConnectedLakes, getStationCoordinates, LAKES, loadLakeData } from './lakes-config'
import { buildDailySegments, computePositions, nameLookupDay, type ScheduleSegment, zurichDate } from './positions'
import { getShipNameByCourseNumber } from './ship-names-api'
import type { ShipPosition } from './ship-position'
import { getAllStationsStationboard } from './transport-api'

export interface ApiShip {
  name: string
  /** Course number without letters and leading zeros, e.g. «7». */
  course: string
  /** Sailing between two stations, or waiting at `from` until `departure`. */
  status: 'sailing' | 'waiting'
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
    .map((p) => ({
      name: p.name,
      course: shortCourse(p),
      status: p.status === 'driving' ? ('sailing' as const) : ('waiting' as const),
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

/** The next departure of every station after `now`, earliest first. */
export function upcomingDepartures(segments: { segment: ScheduleSegment }[], now: Date): Departure[] {
  const first = new Map<string, Date>()
  for (const { segment } of segments) {
    const t = segment.departureTime
    if (t.getTime() <= now.getTime()) continue
    const known = first.get(segment.from.name)
    if (!known || t < known) first.set(segment.from.name, t)
  }
  return Array.from(first, ([station, t]) => ({ time: t.toISOString(), station })).sort((x, y) => x.time.localeCompare(y.time))
}

type Departure = { time: string; station: string }

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
  const day = nameLookupDay(date)
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

/** For tests: the days whose timetable a lake keeps. */
export function scheduledDates(lakeId: string): string[] {
  return Array.from(schedules.keys()).filter((k) => k.startsWith(`${lakeId}|`)).map((k) => k.slice(lakeId.length + 1)).sort()
}

/** Forgets the timetables of days before `today` (the server runs for weeks). */
function forgetPast(lakeId: string, today: string): void {
  for (const date of scheduledDates(lakeId)) if (date < today) schedules.delete(`${lakeId}|${date}`)
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

/** After the day's last departure: tomorrow's first ones (a failed load leaves them out). */
async function departuresFrom(lakeId: string, segments: { segment: ScheduleSegment }[], now: Date): Promise<Departure[]> {
  const today = upcomingDepartures(segments, now)
  if (today.length > 0) return today
  const tomorrow = zurichDate(new Date(now.getTime() + 24 * 60 * 60_000))
  return schedule(lakeId, tomorrow).then(({ segments: next }) => upcomingDepartures(next, now), () => [])
}

/** Ships sailing or waiting at a station now on a lake, cached 30 s; the day's timetable is built once per 6 h. */
export function getLakePositions(
  lakeId: string,
  now = new Date(),
): Promise<{ updatedAt: string; ships: ApiShip[]; nextDeparture: Departure | null; departures: Departure[] }> {
  const hit = positions.get(lakeId)
  if (hit && now.getTime() - hit.at < POSITIONS_TTL_MS) return hit.result
  const today = zurichDate(now)
  forgetPast(lakeId, today)
  const result = schedule(lakeId, today).then(async ({ segments, geoRoutes }) => {
    const departures = await departuresFrom(lakeId, segments, now)
    return {
      updatedAt: now.toISOString(),
      ships: toApiShips(await computePositions(segments, geoRoutes, now)),
      nextDeparture: departures[0] ?? null,
      departures,
    }
  })
  positions.set(lakeId, { at: now.getTime(), result })
  result.catch(() => positions.delete(lakeId))
  return result
}
