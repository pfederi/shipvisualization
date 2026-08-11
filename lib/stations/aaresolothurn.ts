import { Station } from '../lakes-config'

// Eigener Kartenausschnitt nur für den Aare-Abschnitt der BSG-Linie
// (Biel/Bienne - Solothurn) zwischen Nidau und Solothurn.
// Dieselben Stationen sind auch Teil von BIELERSEE_STATIONS.
export const AARESOLOTHURN_STATIONS: Station[] = [
  { name: 'Nidau', latitude: 47.121705, longitude: 7.243338, uic_ref: '8504369' },
  { name: 'Port', latitude: 47.118326, longitude: 7.256596, uic_ref: '8504364' },
  { name: 'Brügg', latitude: 47.122137, longitude: 7.281541, uic_ref: '8504368' },
  { name: 'Büren', latitude: 47.140339, longitude: 7.374014, uic_ref: '8504366' },
  { name: 'Grenchen', latitude: 47.172819, longitude: 7.422572, uic_ref: '8504363' },
  { name: 'Altreu', latitude: 47.190006, longitude: 7.448293, uic_ref: '8504365' },
  { name: 'Solothurn', latitude: 47.203539, longitude: 7.534032, uic_ref: '8504379' },
]

export const AARESOLOTHURN_NAME_MAPPING: Record<string, string> = {
  'Nidau': 'Nidau',
  'Port': 'Port',
  'Brügg': 'Brügg',
  'Büren': 'Büren',
  'Grenchen': 'Grenchen',
  'Altreu': 'Altreu',
  'Solothurn': 'Solothurn',

  'Nidau (Schiff)': 'Nidau',
  'Brügg (Schiff)': 'Brügg',
  'Brügg BE': 'Brügg',
  'Büren (Schiff)': 'Büren',
  'Büren zum Hof': 'Büren',
  'Grenchen (Schiff)': 'Grenchen',
  'Grenchen Süd': 'Grenchen',
  'Altreu, Nord': 'Altreu',
  'Solothurn (Schiff)': 'Solothurn',
}
