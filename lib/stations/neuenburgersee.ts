import { Station } from '../lakes-config'

export const NEUENBURGERSEE_STATIONS: Station[] = [
  // Namen aus GeoJSON (sauber ohne Zusätze, außer wo im GeoJSON vorhanden)
  { name: 'Neuchâtel', latitude: 46.990931, longitude: 6.933243, uic_ref: '8504550' },
  { name: 'Auvernier', latitude: 46.973664, longitude: 6.881585, uic_ref: '8504552' },
  { name: 'Cortaillod', latitude: 46.938713, longitude: 6.854409, uic_ref: '8530793' },
  { name: 'Gorgier - Chez-le-Bart', latitude: 46.899857, longitude: 6.787528, uic_ref: '8504554' },
  { name: 'Saint-Aubin', latitude: 46.889659, longitude: 6.775062, uic_ref: '8504555' },
  { name: 'Concise (bateau)', latitude: 46.847496, longitude: 6.720777, uic_ref: '8504556' },
  { name: 'Grandson', latitude: 46.805872, longitude: 6.643029, uic_ref: '8504557' },
  { name: 'Bevaix', latitude: 46.922072, longitude: 6.822490, uic_ref: '8504559' },
  { name: 'Saint-Blaise', latitude: 47.009690, longitude: 6.982543, uic_ref: '8504560' },
  { name: 'Cudrefin', latitude: 46.959280, longitude: 7.013735, uic_ref: '8504561' },
  { name: 'Portalban', latitude: 46.926486, longitude: 6.952682, uic_ref: '8504562' },
  { name: 'Chevroux', latitude: 46.899820, longitude: 6.896902, uic_ref: '8504563' },
  { name: 'Estavayer-le-Lac', latitude: 46.852370, longitude: 6.837806, uic_ref: '8504564' },
  { name: 'Hauterive', latitude: 47.005412, longitude: 6.970661, uic_ref: '8504808' },
  { name: 'Vaumarcus', latitude: 46.877459, longitude: 6.761132, uic_ref: '8504243' },
  { name: 'La Sauge', latitude: 46.975749, longitude: 7.054032, uic_ref: '8504571' },
  { name: 'Port', latitude: 46.98089, longitude: 6.904842, uic_ref: '8504509' },
  { name: 'La Tène', latitude: 47.006298, longitude: 7.018506, uic_ref: '' }, // Kein UIC-Ref gefunden
]

export const NEUENBURGERSEE_NAME_MAPPING: Record<string, string> = {
  // Direkte Namen aus GeoJSON
  'Neuchâtel': 'Neuchâtel',
  'Auvernier': 'Auvernier',
  'Cortaillod': 'Cortaillod',
  'Gorgier - Chez-le-Bart': 'Gorgier - Chez-le-Bart',
  'Saint-Aubin': 'Saint-Aubin',
  'Concise (bateau)': 'Concise (bateau)',
  'Grandson': 'Grandson',
  'Bevaix': 'Bevaix',
  'Saint-Blaise': 'Saint-Blaise',
  'Cudrefin': 'Cudrefin',
  'Portalban': 'Portalban',
  'Chevroux': 'Chevroux',
  'Estavayer-le-Lac': 'Estavayer-le-Lac',
  'Hauterive': 'Hauterive',
  'Vaumarcus': 'Vaumarcus',
  'La Sauge': 'La Sauge',
  'Port': 'Port',
  'La Tène': 'La Tène',

  // API-Varianten mit Zusätzen
  'Neuchâtel (bateau)': 'Neuchâtel',
  'St-Blaise (bateau)': 'Saint-Blaise',
  'St. Blaise (bateau)': 'Saint-Blaise',
  'St-Blaise': 'Saint-Blaise',
  'St. Blaise': 'Saint-Blaise',
  'St-Aubin NE (bateau)': 'Saint-Aubin',
  'St-Aubin': 'Saint-Aubin',
  'St. Aubin': 'Saint-Aubin',
  'Bevaix (bateau)': 'Bevaix',
  'Estavayer-le-Lac (bateau)': 'Estavayer-le-Lac',
  'Hauterive NE débarcadère': 'Hauterive',
  'Gorgier-Chez-le-Bart': 'Gorgier - Chez-le-Bart',
  'La Sauge (bateau)': 'La Sauge',
  'Neuchâtel Port-de-Serrières': 'Port',
  'Port-de-Serrières': 'Port',
  'Marin-Epagnier, La Tène': 'La Tène',

  // Basisnamen (Fallback)
  'Neuenburg': 'Neuchâtel',
  'Estavayer': 'Estavayer-le-Lac',
  'Gorgier': 'Gorgier - Chez-le-Bart',
  'Chez-le-Bart': 'Gorgier - Chez-le-Bart',
  'Concise': 'Concise (bateau)',

  // Zusätzliche Varianten
  'Neuchâtel bateau': 'Neuchâtel',
  'St-Aubin NE bateau': 'Saint-Aubin',
  'Bevaix bateau': 'Bevaix',
  'St-Blaise bateau': 'Saint-Blaise',
  'Estavayer-le-Lac bateau': 'Estavayer-le-Lac',
}
