import { describe, expect, it } from 'vitest'
import type { ShipPosition } from './ship-position'
import type { ScheduleSegment } from './positions'
import { toApiShips, upcomingDepartures } from './positions.server'

const pos = (over: Partial<ShipPosition>): ShipPosition =>
  ({ id: 'x', name: 'Panta Rhei', latitude: 47.35, longitude: 8.55, course: 135, speed: 10, nextStop: 'Küsnacht ZH (See)', status: 'driving', fromStation: 'Zürich Bürkliplatz (See)', toStation: 'Küsnacht ZH (See)', destination: 'Rapperswil SG (See)', internalCourseNumber: 'BAT 7', officialCourseNumber: '3707', departureTime: new Date('2026-11-19T16:40:00Z'), arrivalTime: new Date('2026-11-19T17:12:00Z'), destinationArrival: new Date('2026-11-19T17:50:00Z'), ...over }) as ShipPosition

describe('positions endpoint', () => {
  it('lists the ships sailing and those waiting at a station, with the fields the Tolino needs', () => {
    const waiting = pos({ name: 'Albis', status: 'at_station', latitude: 47.2967, longitude: 8.5681, course: 0, fromStation: 'Thalwil (See)', toStation: 'Rüschlikon (See)', nextStop: 'Rüschlikon (See)', destination: 'Zürich Bürkliplatz (See)', departureTime: new Date('2026-11-19T13:13:00Z'), arrivalTime: new Date('2026-11-19T13:20:00Z'), destinationArrival: new Date('2026-11-19T13:55:00Z') })
    expect(toApiShips([pos({}), waiting])).toEqual([
      { name: 'Panta Rhei', course: '7', status: 'sailing', lat: 47.35, lon: 8.55, heading: 135, from: 'Zürich Bürkliplatz (See)', to: 'Rapperswil SG (See)', nextStop: 'Küsnacht ZH (See)', departure: '2026-11-19T16:40:00.000Z', arrival: '2026-11-19T17:12:00.000Z', destinationArrival: '2026-11-19T17:50:00.000Z' },
      { name: 'Albis', course: '7', status: 'waiting', lat: 47.2967, lon: 8.5681, heading: 0, from: 'Thalwil (See)', to: 'Zürich Bürkliplatz (See)', nextStop: 'Rüschlikon (See)', departure: '2026-11-19T13:13:00.000Z', arrival: '2026-11-19T13:20:00.000Z', destinationArrival: '2026-11-19T13:55:00.000Z' },
    ])
  })

  it('lists the next departure of every station, earliest first', () => {
    const seg = (dep: string, from: string) => ({ segment: { departureTime: new Date(dep), from: { name: from } } as unknown as ScheduleSegment })
    const segs = [seg('2026-11-19T08:10:00Z', 'Zürich Bürkliplatz (See)'), seg('2026-11-19T07:40:00Z', 'Thalwil (See)'), seg('2026-11-19T09:00:00Z', 'Thalwil (See)')]
    expect(upcomingDepartures(segs, new Date('2026-11-19T07:00:00Z'))).toEqual([
      { time: '2026-11-19T07:40:00.000Z', station: 'Thalwil (See)' },
      { time: '2026-11-19T08:10:00.000Z', station: 'Zürich Bürkliplatz (See)' },
    ])
    expect(upcomingDepartures(segs, new Date('2026-11-19T08:30:00Z'))).toEqual([{ time: '2026-11-19T09:00:00.000Z', station: 'Thalwil (See)' }])
  })
})
