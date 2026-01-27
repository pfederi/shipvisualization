import { Station } from '../lakes-config'

export const ZUGERSEE_STATIONS: Station[] = [
  { name: 'Zug Bahnhofsteg (See)', latitude: 47.170093, longitude: 8.513338, uic_ref: '8502251' },
  { name: 'Zug Landsgemeindeplatz (See)', latitude: 47.1674404, longitude: 8.5135278, uic_ref: '8502246' },
  { name: 'Oberwil bei Zug (See)', latitude: 47.149005, longitude: 8.506797, uic_ref: '8502252' },
  { name: 'Lotenbach (See)', latitude: 47.1144781, longitude: 8.5000958, uic_ref: '8502255' },
  { name: 'Walchwil (See)', latitude: 47.099674, longitude: 8.512493, uic_ref: '8502258' },
  { name: 'Arth am See (Schiff)', latitude: 47.064704, longitude: 8.522324, uic_ref: '8505060' },
  { name: 'Immensee (See)', latitude: 47.096526, longitude: 8.464111, uic_ref: '8502257' },
  { name: 'Risch (See)', latitude: 47.133824, longitude: 8.467976, uic_ref: '8502254' },
  { name: 'Buonas (See)', latitude: 47.14222, longitude: 8.458526, uic_ref: '8502253' },
  { name: 'Cham (See)', latitude: 47.178662, longitude: 8.463469, uic_ref: '8502250' },
]

export const ZUGERSEE_NAME_MAPPING: Record<string, string> = {
  // Direkte Namen aus der API
  'Zug Bahnhofsteg (See)': 'Zug Bahnhofsteg (See)',
  'Zug Landsgemeindeplatz (See)': 'Zug Landsgemeindeplatz (See)',
  'Oberwil bei Zug (See)': 'Oberwil bei Zug (See)',
  'Lotenbach (See)': 'Lotenbach (See)',
  'Walchwil (See)': 'Walchwil (See)',
  'Arth am See (Schiff)': 'Arth am See (Schiff)',
  'Immensee (See)': 'Immensee (See)',
  'Risch (See)': 'Risch (See)',
  'Buonas (See)': 'Buonas (See)',
  'Cham (See)': 'Cham (See)',

  // Basisnamen (Fallback für verschiedene API-Varianten)
  'Zug Bahnhofsteg': 'Zug Bahnhofsteg (See)',
  'Zug Landsgemeindeplatz': 'Zug Landsgemeindeplatz (See)',
  'Oberwil': 'Oberwil bei Zug (See)',
  'Lotenbach': 'Lotenbach (See)',
  'Walchwil': 'Walchwil (See)',
  'Arth': 'Arth am See (Schiff)',
  'Immensee': 'Immensee (See)',
  'Risch': 'Risch (See)',
  'Buonas': 'Buonas (See)',
  'Cham': 'Cham (See)',

  // Zusätzliche Varianten
  'Zug': 'Zug Bahnhofsteg (See)',
  'Arth am See': 'Arth am See (Schiff)',
}