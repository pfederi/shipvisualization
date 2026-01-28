// Lädt Schifffahrtsrouten aus dem exportierten GeoJSON-File

import { unstable_cache } from 'next/cache'
import { Station } from './lakes-config'

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
export async function loadRoutesFromGeoJSON(geojsonPath: string = '/data/zurichsee.geojson'): Promise<ShipRouteData[]> {
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
 * Lädt Ferry-Stationen aus GeoJSON (Points mit ferry stop role)
 */
export async function loadFerryStationsFromGeoJSON(geojsonPath: string): Promise<Station[]> {
  try {
    const response = await fetch(geojsonPath)
    if (!response.ok) {
      console.warn(`GeoJSON für Stationen nicht verfügbar: ${response.statusText}`)
      return []
    }

    const geojson: GeoJSON = await response.json()
    const stations: Station[] = []

    geojson.features.forEach((feature) => {
      // Suche nach Point-Geometrien mit ferry-bezogenen Eigenschaften
      if (feature.geometry.type === 'Point' &&
          feature.properties &&
          feature.geometry.coordinates) {

        const props = feature.properties

        // Prüfe auf verschiedene ferry/stop Indikatoren
        const isFerryStop = props['@relations']?.some((rel: any) =>
          rel.role === 'stop' &&
          (rel.reltags?.route === 'ferry' ||
           rel.reltags?.operator === 'SGV' ||
           rel.reltags?.operator === 'ZSG')
        )

        if (isFerryStop) {
          const coords = feature.geometry.coordinates
          // GeoJSON Point coordinates sind immer [lon, lat]
          let lon: number, lat: number
          if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
            // Verschachteltes Array: [[lon, lat]]
            const firstCoord = coords[0] as number[]
            lon = firstCoord[0]
            lat = firstCoord[1]
          } else {
            // Flaches Array: [lon, lat]
            const flatCoords = coords as unknown as number[]
            lon = flatCoords[0]
            lat = flatCoords[1]
          }
          
          const name = props.name || props['seamark:name'] || `Station ${stations.length + 1}`

          // Bereinige den Namen - behalte SGV-spezifische Namen
          let cleanName = name
            .replace(/^\d+:\s*/, '') // Entferne führende Zahlen (z.B. "3600: ")
            .replace(/\s*Kurs\s*\d+(?:,\d+)*$/, '') // Entferne Kursnummern am Ende
            .trim()

          // Spezielle Behandlung für bekannte Stationen - aber behalte die spezifischen Namen
          // Die GeoJSON-Namen sollten bereits korrekt sein, wir müssen sie nur normalisieren
          const finalName = cleanName

          stations.push({
            name: finalName,
            latitude: lat,
            longitude: lon,
            uic_ref: undefined // OSM hat keine UIC-Refs
          })
        }
      }
    })

    console.log(`📍 ${stations.length} Ferry-Stationen aus GeoJSON geladen`)
    return stations
  } catch (error) {
    console.warn('Fehler beim Laden der Ferry-Stationen aus GeoJSON:', error)
    return []
  }
}

/**
 * Lädt Ferry-Stationen mit Next.js unstable_cache
 */
export async function getCachedFerryStations(geojsonPath: string): Promise<Station[]> {
  if (typeof window === 'undefined') {
    const getCachedStations = unstable_cache(
      async () => loadFerryStationsFromGeoJSON(geojsonPath),
      [`geojson-stations-${geojsonPath}`],
      {
        revalidate: 86400, // 24 Stunden
        tags: ['geojson-stations']
      }
    )

    return getCachedStations()
  } else {
    return loadFerryStationsFromGeoJSON(geojsonPath)
  }
}

/**
 * Lädt Routen mit Next.js unstable_cache (24 Stunden)
 */
export async function getCachedGeoJSONRoutes(geojsonPath: string = '/data/zurichsee.geojson'): Promise<ShipRouteData[]> {
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
