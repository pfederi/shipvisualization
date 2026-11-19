import { describe, expect, it } from 'vitest'
import { getStationCoordinates } from './lakes-config'
import { ZURICHSEE_STATIONS } from './stations/zurichsee'
import { buildDailySegments, computePositions, zurichDate } from './positions'
import type { StationboardEntry } from './transport-api'

const [a, b, c] = ZURICHSEE_STATIONS
const loc = (name: string) => ({ id: '', name, coordinate: { type: 'WGS84', x: 0, y: 0 } }) as never
const entry = (from: string, dep: string): StationboardEntry => ({
  stop: { station: loc(from), departure: dep },
  name: 'BAT 3',
  category: 'BAT',
  number: '3732',
  to: c!.name,
  operator: 'ZSG',
  passList: [
    { station: loc(a!.name), departure: '2026-11-19T17:40:00+0100' },
    { station: loc(b!.name), arrival: '2026-11-19T17:50:00+0100', departure: '2026-11-19T17:52:00+0100' },
    { station: loc(c!.name), arrival: '2026-11-19T18:05:00+0100' },
  ],
})
const input = (boards: StationboardEntry[][]) => ({
  stationboards: new Map(boards.map((e, i) => [`s${i}`, e])),
  mapping: {},
  stationCoords: getStationCoordinates(ZURICHSEE_STATIONS),
  geoRoutes: [],
  lakeId: 'zurichsee',
  shipNameFor: async (course: string) => (course === '3' ? 'Panta Rhei' : null),
})

describe('positions', () => {
  it('takes the date in Zurich, not in UTC', () => {
    expect(zurichDate(new Date('2026-11-19T23:30:00Z'))).toBe('2026-11-20')
    expect(zurichDate(new Date('2026-07-01T22:30:00Z'))).toBe('2026-07-02')
  })

  it('builds one segment per leg, with ship name and destination, once even when two boards list the journey', async () => {
    const segs = await buildDailySegments(input([[entry(a!.name, '2026-11-19T17:40:00+0100')], [entry(b!.name, '2026-11-19T17:52:00+0100')]]))
    expect(segs.map((s) => `${s.segment.from.name}>${s.segment.to.name}`)).toEqual([`${a!.name}>${b!.name}`, `${b!.name}>${c!.name}`])
    expect(segs[0]!.segment).toMatchObject({ resolvedShipName: 'Panta Rhei', internalCourseNumber: 'BAT 3', officialCourseNumber: '3732', destination: c!.name })
    expect(segs[0]!.segment.destinationArrival?.toISOString()).toBe('2026-11-19T17:05:00.000Z')
    // The second leg starts where the first ended: the ship waits there from its arrival.
    expect(segs[1]!.segment.arrivalAtFromStation.toISOString()).toBe('2026-11-19T16:50:00.000Z')
  })

  it('tells waiting, sailing and gone apart, one position per ship', async () => {
    const segs = await buildDailySegments(input([[entry(a!.name, '2026-11-19T17:40:00+0100')]]))
    const at = async (iso: string) => computePositions(segs, [], new Date(iso))
    expect((await at('2026-11-19T16:39:30Z')).map((p) => p.status)).toEqual(['at_station'])
    const sailing = await at('2026-11-19T16:45:00Z')
    expect(sailing).toHaveLength(1)
    expect(sailing[0]).toMatchObject({ status: 'driving', name: 'Panta Rhei', fromStation: a!.name, toStation: b!.name, destination: c!.name })
    expect(sailing[0]!.destinationArrival?.toISOString()).toBe('2026-11-19T17:05:00.000Z')
    expect(sailing[0]!.latitude).toBeGreaterThan(Math.min(a!.latitude, b!.latitude) - 0.01)
    expect((await at('2026-11-19T16:51:00Z'))[0]).toMatchObject({ status: 'at_station', toStation: c!.name })
    expect(await at('2026-11-19T17:10:00Z')).toEqual([])
  })
})
