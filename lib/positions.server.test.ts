import { describe, expect, it } from 'vitest'
import type { ShipPosition } from './ship-position'
import type { ScheduleSegment } from './positions'
import { nextDeparture, toApiShips } from './positions.server'

const pos = (over: Partial<ShipPosition>): ShipPosition =>
  ({ id: 'x', name: 'Panta Rhei', latitude: 47.35, longitude: 8.55, course: 135, speed: 10, nextStop: 'Küsnacht ZH (See)', status: 'driving', fromStation: 'Zürich Bürkliplatz (See)', toStation: 'Küsnacht ZH (See)', destination: 'Rapperswil SG (See)', internalCourseNumber: 'BAT 7', officialCourseNumber: '3707', departureTime: new Date('2026-11-19T16:40:00Z'), arrivalTime: new Date('2026-11-19T17:12:00Z'), ...over }) as ShipPosition

describe('positions endpoint', () => {
  it('lists the ships sailing now with the fields the Tolino needs', () => {
    expect(toApiShips([pos({}), pos({ name: 'Albis', status: 'at_station' })])).toEqual([
      { name: 'Panta Rhei', course: '7', lat: 47.35, lon: 8.55, heading: 135, from: 'Zürich Bürkliplatz (See)', to: 'Rapperswil SG (See)', nextStop: 'Küsnacht ZH (See)', departure: '2026-11-19T16:40:00.000Z', arrival: '2026-11-19T17:12:00.000Z' },
    ])
  })

  it('finds the next departure of the day', () => {
    const seg = (dep: string, from: string) => ({ segment: { departureTime: new Date(dep), from: { name: from } } as unknown as ScheduleSegment })
    const segs = [seg('2026-11-19T08:10:00Z', 'Zürich Bürkliplatz (See)'), seg('2026-11-19T07:40:00Z', 'Thalwil (See)')]
    expect(nextDeparture(segs, new Date('2026-11-19T07:00:00Z'))).toEqual({ time: '2026-11-19T07:40:00.000Z', station: 'Thalwil (See)' })
    expect(nextDeparture(segs, new Date('2026-11-19T09:00:00Z'))).toBeNull()
  })
})
