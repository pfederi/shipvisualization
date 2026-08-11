import { Station } from '../lakes-config'

export const LAGOMAGGIORE_STATIONS: Station[] = [
  // Schweizer Ufer (Betreiber SNL-magg), im Kreis Locarno - Ascona - Brissago - Gambarogno
  { name: 'Locarno (lago)', latitude: 46.170132, longitude: 8.80116, uic_ref: '8505469' },
  { name: 'Tenero (lago)', latitude: 46.173834, longitude: 8.843433, uic_ref: '8505519' },
  { name: 'Magadino (lago)', latitude: 46.147719, longitude: 8.854643, uic_ref: '8505570' },
  { name: 'Vira (Gambarogno) (lago)', latitude: 46.1448, longitude: 8.8413, uic_ref: '8505571' },
  { name: 'Gerra (Gambarogno) (lago)', latitude: 46.124721, longitude: 8.788717, uic_ref: '8505574' },
  { name: 'S. Nazzaro (lago)', latitude: 46.133261, longitude: 8.804251, uic_ref: '8505518' },
  { name: 'Porto Ronco (lago)', latitude: 46.140498, longitude: 8.726698, uic_ref: '8505854' },
  { name: 'Isole di Brissago', latitude: 46.132579, longitude: 8.734703, uic_ref: '8505577' },
  { name: 'Brissago (lago)', latitude: 46.118203, longitude: 8.710932, uic_ref: '8505524' },
  { name: 'Ascona (lago)', latitude: 46.153784, longitude: 8.768723, uic_ref: '8505573' },

  // Italienisches Ufer: hat eine gültige Live-ID, zeigt aber aktuell keine
  // planmässigen Kurse in transport.opendata.ch (ggf. saisonal/reduziert)
  { name: 'Cannobio (lago)', latitude: 46.063484, longitude: 8.700611, uic_ref: '1300091' },
]

export const LAGOMAGGIORE_NAME_MAPPING: Record<string, string> = {
  // Direkte Namen aus der API
  'Locarno (lago)': 'Locarno (lago)',
  'Tenero (lago)': 'Tenero (lago)',
  'Magadino (lago)': 'Magadino (lago)',
  'Vira (Gambarogno) (lago)': 'Vira (Gambarogno) (lago)',
  'Gerra (Gambarogno) (lago)': 'Gerra (Gambarogno) (lago)',
  'S. Nazzaro (lago)': 'S. Nazzaro (lago)',
  'Porto Ronco (lago)': 'Porto Ronco (lago)',
  'Isole di Brissago': 'Isole di Brissago',
  'Brissago (lago)': 'Brissago (lago)',
  'Ascona (lago)': 'Ascona (lago)',
  'Cannobio (lago)': 'Cannobio (lago)',

  // Basisnamen (Fallback für verschiedene API-Varianten)
  'Locarno': 'Locarno (lago)',
  'Tenero': 'Tenero (lago)',
  'Magadino': 'Magadino (lago)',
  'Vira': 'Vira (Gambarogno) (lago)',
  'Vira (Gambarogno)': 'Vira (Gambarogno) (lago)',
  'Gerra': 'Gerra (Gambarogno) (lago)',
  'Gerra (Gambarogno)': 'Gerra (Gambarogno) (lago)',
  'S. Nazzaro': 'S. Nazzaro (lago)',
  'San Nazzaro': 'S. Nazzaro (lago)',
  'Porto Ronco': 'Porto Ronco (lago)',
  'Brissago': 'Brissago (lago)',
  'Ascona': 'Ascona (lago)',
  'Cannobio': 'Cannobio (lago)',
}
