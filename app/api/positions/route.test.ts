import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

const upstream = vi.hoisted(() => ({ fail: false }))
vi.mock('@/lib/positions.server', () => ({
  getLakePositions: async (lake: string) => {
    if (upstream.fail) throw new Error('stationboards down')
    return { updatedAt: '2026-11-19T12:00:00.000Z', ships: [], nextDeparture: null, departures: [], lake }
  },
}))

import { GET } from './route'

const get = (query: string) => GET(new NextRequest(`http://localhost/api/positions${query}`))

describe('GET /api/positions', () => {
  it('answers with the positions of a lake, Zürichsee by default, for any origin', async () => {
    const res = await get('')
    expect(res.status).toBe(200)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(await res.json()).toMatchObject({ lake: 'zurichsee', ships: [] })
  })

  it('refuses an unknown lake and reports an upstream failure as 502', async () => {
    expect((await get('?lake=atlantis')).status).toBe(400)
    upstream.fail = true
    const res = await get('?lake=zurichsee')
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: 'upstream failed' })
  })
})
