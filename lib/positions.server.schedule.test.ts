import { describe, expect, it, vi } from 'vitest'
import { ZURICHSEE_STATIONS } from './stations/zurichsee'
import type { StationboardEntry } from './transport-api'

const boards = vi.hoisted(() => ({ calls: [] as { date: string; force: boolean }[], byDate: {} as Record<string, Map<string, unknown[]>> }))
vi.mock('./transport-api', () => ({
  getAllStationsStationboard: async (_stations: string[], date: string, _time: string, force = false) => {
    boards.calls.push({ date, force })
    return boards.byDate[date] ?? new Map()
  },
}))
vi.mock('./ship-names-api', () => ({ getShipNameByCourseNumber: async () => null }))

import { getLakePositions, scheduledDates } from './positions.server'

const [a, b] = ZURICHSEE_STATIONS
const loc = (name: string) => ({ id: '', name, coordinate: { type: 'WGS84', x: 0, y: 0 } }) as never
/** One journey a → b leaving at `dep` (ISO with offset), 10 minutes long. */
const journey = (dep: string, arr: string): StationboardEntry => ({
  stop: { station: loc(a!.name), departure: dep },
  name: 'BAT 3',
  category: 'BAT',
  number: '3732',
  to: b!.name,
  operator: 'ZSG',
  passList: [{ station: loc(a!.name), departure: dep }, { station: loc(b!.name), arrival: arr }],
})

describe('positions endpoint timetable', () => {
  it('reports an empty timetable as a failure, after one try past the cache', async () => {
    boards.calls = []
    await expect(getLakePositions('zurichsee', new Date('2026-11-19T12:00:00Z'))).rejects.toThrow('Fahrplan leer')
    expect(boards.calls.map((c) => c.force)).toEqual([false, true])
  })

  it('points to tomorrow’s first departures after the last one of the day', async () => {
    boards.byDate['2026-11-21'] = new Map([['s', [journey('2026-11-21T09:40:00+0100', '2026-11-21T09:50:00+0100')]]])
    boards.byDate['2026-11-22'] = new Map([['s', [journey('2026-11-22T08:10:00+0100', '2026-11-22T08:20:00+0100')]]])
    const evening = await getLakePositions('zurichsee', new Date('2026-11-21T19:00:00Z'))
    expect(evening.nextDeparture).toEqual({ time: '2026-11-22T07:10:00.000Z', station: a!.name })
    expect(evening.departures).toEqual([{ time: '2026-11-22T07:10:00.000Z', station: a!.name }])
  })

  it('keeps no timetable of past days', async () => {
    await getLakePositions('zurichsee', new Date('2026-11-22T11:00:00Z'))
    expect(scheduledDates('zurichsee')).toEqual(['2026-11-22'])
  })
})
