import { Station } from '../lakes-config'

export const GREIFENSEE_STATIONS: Station[] = [
  { name: 'Maur (See)', latitude: 47.340069, longitude: 8.678659, uic_ref: '8530645' }, // "Maur (See)" aus API (Schiffsstation, nicht Bus)
  { name: 'Fällanden (See)', latitude: 47.365785, longitude: 8.652552, uic_ref: '8530647' },
  { name: 'Greifensee (See)', latitude: 47.3643286, longitude: 8.6747592, uic_ref: '8530648' },
  { name: 'Uster (See)', latitude: 47.343298, longitude: 8.690407, uic_ref: '8530646' }, // "Uster (See)" aus API (laut OSM auch "Niederuster (See)")
  { name: 'Mönchaltorf (See)', latitude: 47.325965, longitude: 8.700148, uic_ref: '8530696' },
]

export const GREIFENSEE_NAME_MAPPING: Record<string, string> = {
  // Direkte Namen aus der API
  'Maur (See)': 'Maur (See)',
  'Fällanden (See)': 'Fällanden (See)',
  'Greifensee (See)': 'Greifensee (See)',
  'Uster (See)': 'Uster (See)',
  'Niederuster (See)': 'Uster (See)', // Laut OSM ist "Niederuster (See)" = "Uster (See)" (uic_ref: 8530646)
  'Mönchaltorf (See)': 'Mönchaltorf (See)',

  // Basisnamen (Fallback für verschiedene API-Varianten)
  'Maur': 'Maur (See)',
  'Maur, See': 'Maur (See)',
  'Fällanden': 'Fällanden (See)',
  'Greifensee': 'Greifensee (See)',
  'Uster': 'Uster (See)',
  'Uster, See': 'Uster (See)',
  'Niederuster': 'Uster (See)', // Laut OSM ist "Niederuster (See)" = "Uster (See)"
  'Uster, Niederuster': 'Uster (See)', // Laut OSM ist "Niederuster (See)" = "Uster (See)"
  'Mönchaltorf': 'Mönchaltorf (See)',

  // Zusätzliche Varianten
  'Maur See': 'Maur (See)',
  'Fällanden See': 'Fällanden (See)',
  'Greifensee See': 'Greifensee (See)',
  'Uster See': 'Uster (See)',
  'Niederuster See': 'Uster (See)', // Laut OSM ist "Niederuster (See)" = "Uster (See)"
  'Mönchaltorf See': 'Mönchaltorf (See)',
}
