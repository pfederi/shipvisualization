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
    name: 'Genfersee',
    center: [46.45, 6.55],
    zoom: 10,
    geojsonPath: '/data/genfersee.geojson',
    hasShipNames: false,
  },
  aegerisee: {
    id: 'aegerisee',
    name: 'Aegerisee',
    center: [47.13, 8.61],
    zoom: 13,
    geojsonPath: '/data/aegerisee.geojson',
    hasShipNames: false,
  },
  bodensee: {
    id: 'bodensee',
    name: 'Bodensee',
    center: [47.65, 9.18],
    zoom: 9,
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
    center: [46.16, 8.79],
    zoom: 10,
    geojsonPath: '/data/lagomaggiore.geojson',
    hasShipNames: false,
  },
  luganersee: {
    id: 'luganersee',
    name: 'Luganerseee',
    center: [46.00, 8.95],
    zoom: 11,
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
    case 'greifensee': {
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
      } else {
        const { GREIFENSEE_STATIONS, GREIFENSEE_NAME_MAPPING } = await import('./stations/greifensee')
        manualStations = GREIFENSEE_STATIONS
        manualMapping = GREIFENSEE_NAME_MAPPING
        geojsonPath = '/data/greifensee.geojson'
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
        'genfersee': 'Genfersee',
        'aegerisee': 'Aegerisee',
        'bodensee': 'Bodensee',
        'hallwilersee': 'Hallwilersee',
        'lagomaggiore': 'Lago Maggiore',
        'luganersee': 'Luganerseee',
        'walensee': 'Walensee',
        'zugersee': 'Zugersee',
        'greifensee': 'Greifensee'
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
