import { Station } from '../lakes-config'

export const MURTENSEE_STATIONS: Station[] = [
  // Namen aus GeoJSON (wie im GeoJSON definiert)
  { name: 'Murten/Morat (Schiff/bateau)', latitude: 46.930733, longitude: 7.116479, uic_ref: '8504577' },
  { name: 'Faoug', latitude: 46.911376, longitude: 7.076015, uic_ref: '8530821' },
  { name: 'Vallamand', latitude: 46.923865, longitude: 7.038078, uic_ref: '8504575' },
  { name: 'Praz (Vully)', latitude: 46.951510, longitude: 7.097277, uic_ref: '8504573' },
  { name: 'Motier', latitude: 46.946702, longitude: 7.084186, uic_ref: '8504574' },
  { name: 'Sugiez', latitude: 46.964151, longitude: 7.114162, uic_ref: '8504572' },
]

export const MURTENSEE_NAME_MAPPING: Record<string, string> = {
  // Direkte Namen aus GeoJSON
  'Murten/Morat (Schiff/bateau)': 'Murten/Morat (Schiff/bateau)',
  'Faoug': 'Faoug',
  'Vallamand': 'Vallamand',
  'Praz (Vully)': 'Praz (Vully)',
  'Motier': 'Motier',
  'Sugiez': 'Sugiez',

  // API-Varianten mit Zusätzen
  'Faoug débarcadère': 'Faoug',
  'Sugiez (bateau)': 'Sugiez',

  // Basisnamen (Fallback für verschiedene API-Varianten)
  'Murten': 'Murten/Morat (Schiff/bateau)',
  'Morat': 'Murten/Morat (Schiff/bateau)',
  'Praz': 'Praz (Vully)',
  'Vully': 'Praz (Vully)',

  // Zusätzliche Varianten
  'Murten/Morat Schiff': 'Murten/Morat (Schiff/bateau)',
  'Murten/Morat bateau': 'Murten/Morat (Schiff/bateau)',
  'Murten Schiff': 'Murten/Morat (Schiff/bateau)',
  'Morat Schiff': 'Murten/Morat (Schiff/bateau)',
}
