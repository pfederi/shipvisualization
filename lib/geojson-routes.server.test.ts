import { describe, expect, it } from 'vitest'
import { loadRoutesFromFile } from './geojson-routes.server'

describe('loadRoutesFromFile', () => {
  it('reads the routes of a lake from public/ on the server, once', async () => {
    const routes = await loadRoutesFromFile('/data/zurichsee.geojson')
    expect(routes.length).toBeGreaterThan(50)
    expect(routes[0]!.coordinates.length).toBeGreaterThan(1)
    expect(await loadRoutesFromFile('/data/zurichsee.geojson')).toBe(routes)
  })
})
