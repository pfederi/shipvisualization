import { describe, expect, it, vi } from 'vitest'

const boards = vi.hoisted(() => ({ calls: [] as boolean[] }))
vi.mock('./transport-api', () => ({
  getAllStationsStationboard: async (_stations: string[], _date: string, _time: string, force = false) => {
    boards.calls.push(force)
    return new Map()
  },
}))

import { getLakePositions } from './positions.server'

describe('positions endpoint without timetable', () => {
  it('reports an empty timetable as a failure, after one try past the cache', async () => {
    await expect(getLakePositions('zurichsee', new Date('2026-11-19T12:00:00Z'))).rejects.toThrow('Fahrplan leer')
    expect(boards.calls).toEqual([false, true])
  })
})
