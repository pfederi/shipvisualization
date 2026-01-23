// Lädt Schifffahrtsrouten aus dem exportierten GeoJSON-File

import { unstable_cache } from 'next/cache'

export interface RouteCoordinate {
  lat: number
  lon: number
}

export interface ShipRouteData {
  id: string
  name?: string
  ref?: string
  coordinates: RouteCoordinate[]
  type?: string
}

interface GeoJSONFeature {
  type: string
  properties: {
    '@id'?: string
    name?: string
    ref?: string
    route?: string
    [key: string]: any
  }
  geometry: {
    type: string
    coordinates: number[][][] | number[][] // MultiLineString oder LineString
  }
}

interface GeoJSON {
  type: string
  features: GeoJSONFeature[]
}

/**
 * Lädt Schifffahrtsrouten aus dem GeoJSON-File
 */
export async function loadRoutesFromGeoJSON(geojsonPath: string = '/data/export.geojson'): Promise<ShipRouteData[]> {
  try {
    // Lade das GeoJSON-File
    const response = await fetch(geojsonPath)
    if (!response.ok) {
      throw new Error(`Fehler beim Laden des GeoJSON-Files ${geojsonPath}: ${response.statusText}`)
    }

    const geojson: GeoJSON = await response.json()
    console.log('GeoJSON geladen:', geojson.features.length, 'Features')

    const routes: ShipRouteData[] = []

    geojson.features.forEach((feature, index) => {
      // Extrahiere ID und Name aus Properties
      const baseId = feature.properties['@id']?.replace('relation/', '') || 
                     feature.properties['@id']?.replace('way/', '') || 
                     `route-${index}`
      const baseName = feature.properties.name || 
                      feature.properties.ref || 
                      feature.properties['seamark:name'] || 
                      `Route ${index + 1}`
      const baseRef = feature.properties.ref

      // Verarbeite MultiLineString oder LineString
      if (feature.geometry.type === 'MultiLineString') {
        // MultiLineString: Jede LineString wird als separate Route behandelt
        const multiCoords = feature.geometry.coordinates as number[][][]
        multiCoords.forEach((lineString, lineIndex) => {
          const coordinates: RouteCoordinate[] = []
          
          lineString.forEach((coord) => {
            // GeoJSON verwendet [lon, lat], wir brauchen [lat, lon]
            const [lon, lat] = coord
            coordinates.push({ lat, lon })
          })

          // Alle Routen hinzufügen, auch wenn sie nur einen Punkt haben
          if (coordinates.length > 0) {
            routes.push({
              id: `geojson-${baseId}-${lineIndex}`,
              name: multiCoords.length > 1 ? `${baseName} (Teil ${lineIndex + 1})` : baseName,
              ref: baseRef,
              coordinates,
              type: feature.properties.route || 'ferry',
            })
          }
        })
      } else if (feature.geometry.type === 'LineString') {
        // LineString: Array von Koordinaten
        const coordinates: RouteCoordinate[] = []
        const lineCoords = feature.geometry.coordinates as number[][]
        
        lineCoords.forEach((coord) => {
          // GeoJSON verwendet [lon, lat], wir brauchen [lat, lon]
          const [lon, lat] = coord
          coordinates.push({ lat, lon })
        })

        // Alle Routen hinzufügen, auch wenn sie nur einen Punkt haben
        if (coordinates.length > 0) {
          routes.push({
            id: `geojson-${baseId}`,
            name: baseName,
            ref: baseRef,
            coordinates,
            type: feature.properties.route || 'ferry',
          })
        }
      }
    })

    console.log(`Gefundene Routen aus GeoJSON: ${routes.length}`)
    return routes
  } catch (error) {
    console.error('Fehler beim Laden der Routen aus GeoJSON:', error)
    return []
  }
}

/**
 * Lädt Routen mit Next.js unstable_cache (24 Stunden)
 */
export async function getCachedGeoJSONRoutes(geojsonPath: string = '/data/export.geojson'): Promise<ShipRouteData[]> {
  // Verwende unstable_cache für server-seitiges Caching
  // Nur server-seitig verfügbar, daher Fallback für Client
  if (typeof window === 'undefined') {
    const getCachedRoutes = unstable_cache(
      async () => loadRoutesFromGeoJSON(geojsonPath),
      [`geojson-routes-${geojsonPath}`],
      {
        revalidate: 86400, // 24 Stunden
        tags: ['geojson-routes']
      }
    )
    
    return getCachedRoutes()
  } else {
    // Client-seitig: Direkter Load (Browser-Cache wird verwendet)
    return loadRoutesFromGeoJSON(geojsonPath)
  }
}
