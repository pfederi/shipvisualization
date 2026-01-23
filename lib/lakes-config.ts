// Configuration for different lakes
// Based on: https://github.com/pfederi/Next-Wave/blob/main/Next%20Wave/Data/stations.json

export interface Station {
  name: string
  latitude: number
  longitude: number
  uic_ref?: string
}

export interface LakeConfig {
  id: string
  name: string
  center: [number, number]
  zoom: number
  geojsonPath: string
  hasShipNames?: boolean // Ob Schiffsnamen über die API verfügbar sind
}

export const LAKES: Record<string, LakeConfig> = {
  zurichsee: {
    id: 'zurichsee',
    name: 'Zürichsee',
    center: [47.28, 8.6],
    zoom: 12,
    geojsonPath: '/data/zurichsee.geojson',
    hasShipNames: true,
  },
  vierwaldstaettersee: {
    id: 'vierwaldstaettersee',
    name: 'Vierwaldstättersee',
    center: [46.97, 8.45],
    zoom: 12,
    geojsonPath: '/data/vierwaldstaettersee.geojson',
    hasShipNames: false,
  }
}

/**
 * Lädt die Stationen und das Namens-Mapping für einen bestimmten See dynamisch
 */
export async function loadLakeData(lakeId: string): Promise<{ stations: Station[], mapping: Record<string, string> }> {
  switch (lakeId) {
    case 'zurichsee':
      const { ZURICHSEE_STATIONS, ZURICHSEE_NAME_MAPPING } = await import('./stations/zurichsee')
      return { stations: ZURICHSEE_STATIONS, mapping: ZURICHSEE_NAME_MAPPING }
    case 'vierwaldstaettersee':
      const { VIERWALDSTAETTERSEE_STATIONS, VIERWALDSTAETTERSEE_NAME_MAPPING } = await import('./stations/vierwaldstaettersee')
      return { stations: VIERWALDSTAETTERSEE_STATIONS, mapping: VIERWALDSTAETTERSEE_NAME_MAPPING }
    default:
      return { stations: [], mapping: {} }
  }
}

/**
 * Hilfsfunktion zur Normalisierung von Stationsnamen (synchron, benötigt Mapping)
 */
export function normalizeStationName(name: string, mapping: Record<string, string>): string {
  if (!name) return name
  
  // Bekannte Varianten abfangen
  const upperName = name.toUpperCase()
  for (const [key, value] of Object.entries(mapping)) {
    if (key.toUpperCase() === upperName) return value
  }

  // Entferne bekannte Suffixe für besseres Matching
  const cleanName = name
    .replace(/\s\(See\)/gi, '')
    .replace(/\s\(See-Schiff\)/gi, '')
    .replace(/\sZH/gi, '')
    .replace(/\sSG/gi, '')
    .replace(/\sSZ/gi, '')
    .trim()
  
  // Erneuter Check mit cleanName
  const upperCleanName = cleanName.toUpperCase()
  for (const [key, value] of Object.entries(mapping)) {
    if (key.toUpperCase() === upperCleanName) return value
  }
  
  return name
}

/**
 * Erstellt eine Map der Stations-Koordinaten (synchron, benötigt Stationen)
 */
export function getStationCoordinates(stations: Station[]): Map<string, { lat: number; lon: number }> {
  const map = new Map()
  
  stations.forEach(station => {
    map.set(station.name, { lat: station.latitude, lon: station.longitude })
    
    // Wir mappen auch Varianten ohne (See), aber nur für den Lookup
    const nameWithoutSuffix = station.name.replace(' (See)', '')
    if (!map.has(nameWithoutSuffix)) {
      map.set(nameWithoutSuffix, { lat: station.latitude, lon: station.longitude })
    }
  })
  return map
}
