import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parseRoutesGeoJSON, type ShipRouteData } from './geojson-routes'

const loaded = new Map<string, Promise<ShipRouteData[]>>()

/** Routes of a lake from public/<geojsonPath>, read once per path; for server code (the relative fetch fails in Node). */
export function loadRoutesFromFile(geojsonPath: string): Promise<ShipRouteData[]> {
  let routes = loaded.get(geojsonPath)
  if (!routes) {
    routes = readFile(path.join(process.cwd(), 'public', geojsonPath), 'utf8').then((text) => parseRoutesGeoJSON(JSON.parse(text)))
    loaded.set(geojsonPath, routes)
    routes.catch(() => loaded.delete(geojsonPath))
  }
  return routes
}
