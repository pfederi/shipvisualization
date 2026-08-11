import { Station } from './types'

export type { Station } from './types'

export interface LakeConfig {
  id: string
  name: string
  center: [number, number]
  zoom: number
  geojsonPath: string
  hasShipNames: boolean
}

export const LAKES: Record<string, LakeConfig> = {
  zurichsee: {
    id: 'zurichsee',
    name: 'Zürichsee',
    center: [47.25, 8.65],
    zoom: 11,
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
  },
  thunersee: {
    id: 'thunersee',
    name: 'Thunersee',
    center: [46.68, 7.7],
    zoom: 12,
    geojsonPath: '/data/thunersee.geojson',
    hasShipNames: false,
  },
  brienzersee: {
    id: 'brienzersee',
    name: 'Brienzersee',
    center: [46.72, 7.95],
    zoom: 12,
    geojsonPath: '/data/brienzersee.geojson',
    hasShipNames: false,
  },
  genfersee: {
    id: 'genfersee',
    name: 'Lac Léman',
    center: [46.45, 6.55],
    zoom: 10,
    geojsonPath: '/data/genfersee.geojson',
    hasShipNames: false,
  },
  aegerisee: {
    id: 'aegerisee',
    name: 'Ägerisee',
    center: [47.13, 8.61],
    zoom: 13,
    geojsonPath: '/data/aegerisee.geojson',
    hasShipNames: false,
  },
  bodensee: {
    id: 'bodensee',
    name: 'Bodensee',
    center: [47.58, 9.3],
    zoom: 11,
    geojsonPath: '/data/bodensee.geojson',
    hasShipNames: false,
  },
  hallwilersee: {
    id: 'hallwilersee',
    name: 'Hallwilersee',
    center: [47.27, 8.22],
    zoom: 12,
    geojsonPath: '/data/hallwilersee.geojson',
    hasShipNames: false,
  },
  lagomaggiore: {
    id: 'lagomaggiore',
    name: 'Lago Maggiore',
    center: [46.146, 8.783],
    zoom: 12,
    geojsonPath: '/data/lagomaggiore.geojson',
    hasShipNames: false,
  },
  luganersee: {
    id: 'luganersee',
    name: 'Lago di Lugano',
    center: [45.955, 8.94],
    zoom: 12,
    geojsonPath: '/data/luganersee.geojson',
    hasShipNames: false,
  },
  walensee: {
    id: 'walensee',
    name: 'Walensee',
    center: [47.12, 9.20],
    zoom: 12,
    geojsonPath: '/data/walensee.geojson',
    hasShipNames: false,
  },
  zugersee: {
    id: 'zugersee',
    name: 'Zugersee',
    center: [47.16, 8.49],
    zoom: 12,
    geojsonPath: '/data/zugersee.geojson',
    hasShipNames: false,
  },
  greifensee: {
    id: 'greifensee',
    name: 'Greifensee',
    center: [47.35, 8.68],
    zoom: 13,
    geojsonPath: '/data/greifensee.geojson',
    hasShipNames: false,
  },
  bielersee: {
    id: 'bielersee',
    name: 'Bielersee',
    center: [47.068, 7.234],
    zoom: 11,
    geojsonPath: '/data/bielersee.geojson',
    hasShipNames: false,
  },
  neuenburgersee: {
    id: 'neuenburgersee',
    name: 'Neuenburgersee',
    center: [46.959, 6.938],
    zoom: 11,
    geojsonPath: '/data/neuenburgersee.geojson',
    hasShipNames: false,
  },
  murtensee: {
    id: 'murtensee',
    name: 'Murtensee',
    center: [47.021, 7.085],
    zoom: 11,
    geojsonPath: '/data/murtensee.geojson',
    hasShipNames: false,
  },
  rheinschaffhausen: {
    id: 'rheinschaffhausen',
    name: 'Rhein (Schaffhausen)',
    center: [47.678, 8.75],
    zoom: 12,
    geojsonPath: '/data/rheinschaffhausen.geojson',
    hasShipNames: false,
  },
  aaresolothurn: {
    id: 'aaresolothurn',
    name: 'Aare (Solothurn)',
    center: [47.16, 7.39],
    zoom: 11,
    geojsonPath: '/data/aaresolothurn.geojson',
    hasShipNames: false,
  }
}

/**
 * Die drei Seen sind miteinander verbunden und sollten zusammen angezeigt werden
 */
export const CONNECTED_THREE_LAKES = ['bielersee', 'neuenburgersee', 'murtensee'] as const

/**
 * Gibt alle verbundenen Seen für einen gegebenen See zurück
 * Für die drei Seen (Bielersee, Neuenburgersee, Murtensee) werden alle drei zurückgegeben
 */
export function getConnectedLakes(lakeId: string): string[] {
  if (CONNECTED_THREE_LAKES.includes(lakeId as any)) {
    return [...CONNECTED_THREE_LAKES]
  }
  return [lakeId]
}

/**
 * Berechnet das gemeinsame Zentrum und Zoom-Level für mehrere Seen
 */
export function getCombinedLakeBounds(lakeIds: string[]): { center: [number, number], zoom: number } {
  if (lakeIds.length === 1) {
    const lake = LAKES[lakeIds[0]]
    return { center: lake.center, zoom: lake.zoom }
  }
  
  // Für mehrere Seen: Berechne Bounding Box
  const lakes = lakeIds.map(id => LAKES[id]).filter(Boolean)
  if (lakes.length === 0) {
    return { center: [47.0, 7.0], zoom: 10 }
  }
  
  // Finde Min/Max Koordinaten
  let minLat = Infinity, maxLat = -Infinity
  let minLon = Infinity, maxLon = -Infinity
  
  lakes.forEach(lake => {
    const [lat, lon] = lake.center
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
    minLon = Math.min(minLon, lon)
    maxLon = Math.max(maxLon, lon)
  })
  
  // Zentrum berechnen
  const center: [number, number] = [(minLat + maxLat) / 2, (minLon + maxLon) / 2]
  
  // Zoom-Level basierend auf Ausdehnung schätzen
  const latDiff = maxLat - minLat
  const lonDiff = maxLon - minLon
  const maxDiff = Math.max(latDiff, lonDiff)
  
  let zoom = 10
  if (maxDiff < 0.1) zoom = 11
  else if (maxDiff < 0.05) zoom = 12
  else if (maxDiff < 0.02) zoom = 13
  else if (maxDiff > 0.3) zoom = 9
  else if (maxDiff > 0.5) zoom = 8
  
  return { center, zoom }
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
    case 'thunersee':
    case 'brienzersee':
    case 'genfersee':
    case 'aegerisee':
    case 'bodensee':
    case 'hallwilersee':
    case 'lagomaggiore':
    case 'luganersee':
    case 'walensee':
    case 'zugersee':
    case 'greifensee':
    case 'bielersee':
    case 'neuenburgersee':
    case 'murtensee':
    case 'rheinschaffhausen':
    case 'aaresolothurn': {
      let manualStations: Station[]
      let manualMapping: Record<string, string>
      let geojsonPath: string

      if (lakeId === 'vierwaldstaettersee') {
        const { VIERWALDSTAETTERSEE_STATIONS, VIERWALDSTAETTERSEE_NAME_MAPPING } = await import('./stations/vierwaldstaettersee')
        manualStations = VIERWALDSTAETTERSEE_STATIONS
        manualMapping = VIERWALDSTAETTERSEE_NAME_MAPPING
        geojsonPath = '/data/vierwaldstaettersee.geojson'
      } else if (lakeId === 'thunersee') {
        const { THUNERSEE_STATIONS, THUNERSEE_NAME_MAPPING } = await import('./stations/thunersee')
        manualStations = THUNERSEE_STATIONS
        manualMapping = THUNERSEE_NAME_MAPPING
        geojsonPath = '/data/thunersee.geojson'
      } else if (lakeId === 'brienzersee') {
        const { BRIENZERSEE_STATIONS, BRIENZERSEE_NAME_MAPPING } = await import('./stations/brienzersee')
        manualStations = BRIENZERSEE_STATIONS
        manualMapping = BRIENZERSEE_NAME_MAPPING
        geojsonPath = '/data/brienzersee.geojson'
      } else if (lakeId === 'genfersee') {
        const { GENFERSEE_STATIONS, GENFERSEE_NAME_MAPPING } = await import('./stations/genfersee')
        manualStations = GENFERSEE_STATIONS
        manualMapping = GENFERSEE_NAME_MAPPING
        geojsonPath = '/data/genfersee.geojson'
      } else if (lakeId === 'aegerisee') {
        const { AEGERISEE_STATIONS, AEGERISEE_NAME_MAPPING } = await import('./stations/aegerisee')
        manualStations = AEGERISEE_STATIONS
        manualMapping = AEGERISEE_NAME_MAPPING
        geojsonPath = '/data/aegerisee.geojson'
      } else if (lakeId === 'bodensee') {
        const { BODENSEE_STATIONS, BODENSEE_NAME_MAPPING } = await import('./stations/bodensee')
        manualStations = BODENSEE_STATIONS
        manualMapping = BODENSEE_NAME_MAPPING
        geojsonPath = '/data/bodensee.geojson'
      } else if (lakeId === 'hallwilersee') {
        const { HALLWILERSEE_STATIONS, HALLWILERSEE_NAME_MAPPING } = await import('./stations/hallwilersee')
        manualStations = HALLWILERSEE_STATIONS
        manualMapping = HALLWILERSEE_NAME_MAPPING
        geojsonPath = '/data/hallwilersee.geojson'
      } else if (lakeId === 'lagomaggiore') {
        const { LAGOMAGGIORE_STATIONS, LAGOMAGGIORE_NAME_MAPPING } = await import('./stations/lagomaggiore')
        manualStations = LAGOMAGGIORE_STATIONS
        manualMapping = LAGOMAGGIORE_NAME_MAPPING
        geojsonPath = '/data/lagomaggiore.geojson'
      } else if (lakeId === 'luganersee') {
        const { LUGANERSEE_STATIONS, LUGANERSEE_NAME_MAPPING } = await import('./stations/luganersee')
        manualStations = LUGANERSEE_STATIONS
        manualMapping = LUGANERSEE_NAME_MAPPING
        geojsonPath = '/data/luganersee.geojson'
      } else if (lakeId === 'walensee') {
        const { WALENSEE_STATIONS, WALENSEE_NAME_MAPPING } = await import('./stations/walensee')
        manualStations = WALENSEE_STATIONS
        manualMapping = WALENSEE_NAME_MAPPING
        geojsonPath = '/data/walensee.geojson'
      } else if (lakeId === 'zugersee') {
        const { ZUGERSEE_STATIONS, ZUGERSEE_NAME_MAPPING } = await import('./stations/zugersee')
        manualStations = ZUGERSEE_STATIONS
        manualMapping = ZUGERSEE_NAME_MAPPING
        geojsonPath = '/data/zugersee.geojson'
      } else if (lakeId === 'greifensee') {
        const { GREIFENSEE_STATIONS, GREIFENSEE_NAME_MAPPING } = await import('./stations/greifensee')
        manualStations = GREIFENSEE_STATIONS
        manualMapping = GREIFENSEE_NAME_MAPPING
        geojsonPath = '/data/greifensee.geojson'
      } else if (lakeId === 'bielersee') {
        const { BIELERSEE_STATIONS, BIELERSEE_NAME_MAPPING } = await import('./stations/bielersee')
        manualStations = BIELERSEE_STATIONS
        manualMapping = BIELERSEE_NAME_MAPPING
        geojsonPath = '/data/bielersee.geojson'
      } else if (lakeId === 'neuenburgersee') {
        const { NEUENBURGERSEE_STATIONS, NEUENBURGERSEE_NAME_MAPPING } = await import('./stations/neuenburgersee')
        manualStations = NEUENBURGERSEE_STATIONS
        manualMapping = NEUENBURGERSEE_NAME_MAPPING
        geojsonPath = '/data/neuenburgersee.geojson'
      } else if (lakeId === 'murtensee') {
        const { MURTENSEE_STATIONS, MURTENSEE_NAME_MAPPING } = await import('./stations/murtensee')
        manualStations = MURTENSEE_STATIONS
        manualMapping = MURTENSEE_NAME_MAPPING
        geojsonPath = '/data/murtensee.geojson'
      } else if (lakeId === 'rheinschaffhausen') {
        const { RHEINSCHAFFHAUSEN_STATIONS, RHEINSCHAFFHAUSEN_NAME_MAPPING } = await import('./stations/rheinschaffhausen')
        manualStations = RHEINSCHAFFHAUSEN_STATIONS
        manualMapping = RHEINSCHAFFHAUSEN_NAME_MAPPING
        geojsonPath = '/data/rheinschaffhausen.geojson'
      } else if (lakeId === 'aaresolothurn') {
        const { AARESOLOTHURN_STATIONS, AARESOLOTHURN_NAME_MAPPING } = await import('./stations/aaresolothurn')
        manualStations = AARESOLOTHURN_STATIONS
        manualMapping = AARESOLOTHURN_NAME_MAPPING
        geojsonPath = '/data/aaresolothurn.geojson'
      } else {
        // Fallback
        manualStations = []
        manualMapping = {}
        geojsonPath = '/data/zurichsee.geojson'
      }

      // Ergänze mit GeoJSON-Stationen für besseres Mapping
      const { getCachedFerryStations } = await import('./geojson-routes')
      const geojsonStations = await getCachedFerryStations(geojsonPath)

      // Kombiniere beide Quellen (manuell konfigurierte haben Priorität)
      const combinedStations = [...manualStations]
      const existingNames = new Set(manualStations.map(s => s.name))

      geojsonStations.forEach(geoStation => {
        if (!existingNames.has(geoStation.name)) {
          combinedStations.push(geoStation)
          console.log(`➕ Zusätzliche Ferry-Station aus GeoJSON: ${geoStation.name}`)
        }
      })

      const lakeNames: Record<string, string> = {
        'vierwaldstaettersee': 'Vierwaldstättersee',
        'thunersee': 'Thunersee',
        'brienzersee': 'Brienzersee',
        'genfersee': 'Lac Léman',
        'aegerisee': 'Ägerisee',
        'bodensee': 'Bodensee',
        'hallwilersee': 'Hallwilersee',
        'lagomaggiore': 'Lago Maggiore',
        'luganersee': 'Lago di Lugano',
        'walensee': 'Walensee',
        'zugersee': 'Zugersee',
        'greifensee': 'Greifensee',
        'bielersee': 'Bielersee',
        'neuenburgersee': 'Neuenburgersee',
        'murtensee': 'Murtensee',
        'rheinschaffhausen': 'Rhein (Schaffhausen)',
        'aaresolothurn': 'Aare (Solothurn)'
      }
      console.log(`🚢 ${lakeNames[lakeId] || lakeId}: ${manualStations.length} manuelle + ${geojsonStations.length - manualStations.length} GeoJSON = ${combinedStations.length} Stationen`)

      return { stations: combinedStations, mapping: manualMapping }
    }
    default:
      return { stations: [], mapping: {} }
  }
}

/**
 * Hilfsfunktion zum Erstellen einer Koordinaten-Map aus Stationen
 * Erstellt Einträge sowohl für UIC-Codes als auch für Stationsnamen
 */
export function getStationCoordinates(stations: Station[]): Map<string, { lat: number; lon: number }> {
  const coords = new Map<string, { lat: number; lon: number }>()

  for (const station of stations) {
    const coordData = { lat: station.latitude, lon: station.longitude }
    
    // Füge UIC-Code hinzu (falls vorhanden)
    if (station.uic_ref) {
      coords.set(station.uic_ref, coordData)
    }
    
    // Füge auch den Stationsnamen hinzu
    coords.set(station.name, coordData)
  }

  return coords
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

  // Spezielle Behandlung für bekannte Stationen
  let cleanName = name
    .replace(/\s\(See\)/gi, '')
    .replace(/\s\(See-Schiff\)/gi, '')
    .replace(/\s*Landungssteg\s*SGV\s*$/gi, '') // Added this for SGV names
    .replace(/\sZH/gi, '')
    .replace(/\sSG/gi, '')
    .replace(/\sSZ/gi, '')
    .trim()

  // Zweiter Durchlauf mit bereinigtem Namen
  const upperCleanName = cleanName.toUpperCase()
  for (const [key, value] of Object.entries(mapping)) {
    if (key.toUpperCase() === upperCleanName) return value
  }

  return name
}

/**
 * Hilfsfunktion zur Umkehrung des Name-Mappings: Findet den API-Namen für einen GeoJSON-Namen
 * Gibt den ersten gefundenen API-Namen zurück, der auf den GeoJSON-Namen gemappt wird
 */
export function getApiStationName(geojsonName: string, mapping: Record<string, string>): string {
  if (!geojsonName || !mapping) return geojsonName
  
  // Suche nach einem Mapping-Eintrag, dessen Wert dem GeoJSON-Namen entspricht
  for (const [apiName, mappedName] of Object.entries(mapping)) {
    if (mappedName === geojsonName) {
      // Wenn der API-Name ein vollständiger Name mit Zusätzen ist (z.B. "Twann (Schiff)"), verwende diesen
      if (apiName.includes('(Schiff)') || apiName.includes('(bateau)') || apiName.includes('(Schiff/bateau)')) {
        return apiName
      }
    }
  }
  
  // Fallback: Verwende den GeoJSON-Namen direkt
  return geojsonName
}
