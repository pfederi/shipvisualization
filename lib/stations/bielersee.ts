import { Station } from '../lakes-config'

export const BIELERSEE_STATIONS: Station[] = [
  // Namen aus GeoJSON (sauber ohne Zusätze)
  { name: 'Biel/Bienne', latitude: 47.131145, longitude: 7.235792, uic_ref: '8504371' },
  { name: 'Tüscherz', latitude: 47.112403, longitude: 7.193780, uic_ref: '8504372' },
  { name: 'Engelberg-Wingreis', latitude: 47.102036, longitude: 7.177788, uic_ref: '8504373' },
  { name: 'Ligerz', latitude: 47.083291, longitude: 7.135521, uic_ref: '8504375' },
  { name: 'St. Petersinsel Nord', latitude: 47.068358, longitude: 7.135374, uic_ref: '8504376' },
  { name: 'La Neuveville', latitude: 47.061293, longitude: 7.093533, uic_ref: '8504377' },
  { name: 'Erlach', latitude: 47.049399, longitude: 7.097354, uic_ref: '8504378' },
  { name: 'St. Petersinsel Süd', latitude: 47.068996, longitude: 7.145385, uic_ref: '8504370' },
  { name: 'Le Landeron', latitude: 47.051143, longitude: 7.076290, uic_ref: '8504565' },
  { name: 'Lüscherz', latitude: 47.049111, longitude: 7.150599, uic_ref: '' }, // Kein UIC-Ref in GeoJSON
  { name: 'Twann', latitude: 47.093407, longitude: 7.156989, uic_ref: '8504374' },
  { name: 'Nidau', latitude: 47.121705, longitude: 7.243338, uic_ref: '8504369' },
  { name: 'Port', latitude: 47.118326, longitude: 7.256596, uic_ref: '8504364' },
  { name: 'Brügg', latitude: 47.122137, longitude: 7.281541, uic_ref: '8504368' },
  { name: 'Thielle', latitude: 47.019672, longitude: 7.033067, uic_ref: '8504567' }, // Thielle-Wavre (Schiffsstation am Kanal Neuenburgersee/Bielersee)
  { name: 'Büren', latitude: 47.140339, longitude: 7.374014, uic_ref: '8504366' }, // Büren an der Aare
  { name: 'Grenchen', latitude: 47.172819, longitude: 7.422572, uic_ref: '8504363' }, // Grenchen, Anlegestelle an der Aare
  { name: 'Altreu', latitude: 47.190006, longitude: 7.448293, uic_ref: '8504365' }, // BSG-Schiffstation Altreu
  { name: 'Solothurn', latitude: 47.203539, longitude: 7.534032, uic_ref: '8504379' },
  { name: 'Camping 3 Lacs', latitude: 46.975684, longitude: 7.093223, uic_ref: '8504499' },
]

export const BIELERSEE_NAME_MAPPING: Record<string, string> = {
  // Direkte Namen aus GeoJSON
  'Biel/Bienne': 'Biel/Bienne',
  'Tüscherz': 'Tüscherz',
  'Engelberg-Wingreis': 'Engelberg-Wingreis',
  'Ligerz': 'Ligerz',
  'St. Petersinsel Nord': 'St. Petersinsel Nord',
  'La Neuveville': 'La Neuveville',
  'Erlach': 'Erlach',
  'St. Petersinsel Süd': 'St. Petersinsel Süd',
  'Le Landeron': 'Le Landeron',
  'Lüscherz': 'Lüscherz',
  'Twann': 'Twann',
  'Nidau': 'Nidau',
  'Port': 'Port',
  'Brügg': 'Brügg',
  'Thielle': 'Thielle',
  'Büren': 'Büren',
  'Grenchen': 'Grenchen',
  'Altreu': 'Altreu',
  'Solothurn': 'Solothurn',
  'Camping 3 Lacs': 'Camping 3 Lacs',

  // API-Varianten mit Zusätzen
  'Biel/Bienne (Schiff/bateau)': 'Biel/Bienne',
  'Biel/Bienne (Schiff)': 'Biel/Bienne',
  'Biel/Bienne (bateau)': 'Biel/Bienne',
  'Tüscherz (Schiff)': 'Tüscherz',
  'Ligerz (Schiff)': 'Ligerz',
  'La Neuveville (bateau)': 'La Neuveville',
  'Erlach (Schiff)': 'Erlach',
  'Le Landeron débarcadère': 'Le Landeron',
  'Twann (Schiff)': 'Twann',
  'Brügg BE': 'Brügg',
  'Nidau (Schiff)': 'Nidau',
  'Brügg (Schiff)': 'Brügg',
  'Büren (Schiff)': 'Büren',
  'Grenchen (Schiff)': 'Grenchen',
  'Solothurn (Schiff)': 'Solothurn',
  'Biel/Bienne, Zihlplatz/Thielle': 'Thielle',
  'Zihlplatz/Thielle': 'Thielle',
  'Zihlplatz': 'Thielle',
  'Thielle-Wavre': 'Thielle',
  'Thielle-Wavre (Schiff)': 'Thielle',
  'Thielle-Wavre (bateau)': 'Thielle',
  'Thielle-Wavre (Schiff/bateau)': 'Thielle',
  'Büren zum Hof': 'Büren',
  'Grenchen Süd': 'Grenchen',
  'Altreu, Nord': 'Altreu',
  'Trois-Lacs (camping)': 'Camping 3 Lacs',
  'Camping Trois Lacs': 'Camping 3 Lacs',

  // Basisnamen (Fallback)
  'Biel': 'Biel/Bienne',
  'Bienne': 'Biel/Bienne',
  'Engelberg': 'Engelberg-Wingreis',
  'Wingreis': 'Engelberg-Wingreis',
  'St. Petersinsel': 'St. Petersinsel Nord',
  'Landeron': 'Le Landeron',

  // Zusätzliche Varianten
  'Biel/Bienne Schiff': 'Biel/Bienne',
  'Biel/Bienne bateau': 'Biel/Bienne',
  'Tüscherz Schiff': 'Tüscherz',
  'Ligerz Schiff': 'Ligerz',
  'Erlach Schiff': 'Erlach',
  'La Neuveville bateau': 'La Neuveville',
}
