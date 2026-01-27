import { Station } from '../lakes-config'

export const BRIENZERSEE_STATIONS: Station[] = [
  { name: 'Interlaken Ost (See)', latitude: 46.689389, longitude: 7.898057, uic_ref: '8508371' },
  { name: 'Bönigen', latitude: 46.689389, longitude: 7.898057, uic_ref: '8508371' },
  { name: 'Iseltwald (See)', latitude: 46.711816, longitude: 7.962552, uic_ref: '8508379' },
  { name: 'Giessbach', latitude: 46.734822, longitude: 8.019468, uic_ref: '8508378' },
  { name: 'Oberried am Brienzersee (See)', latitude: 46.73658, longitude: 7.96278, uic_ref: '8508374' },
  { name: 'Niederried (See)', latitude: 46.717744, longitude: 7.932318, uic_ref: '8508373' },
  { name: 'Ringgenberg (See)', latitude: 46.70137, longitude: 7.898407, uic_ref: '8508372' },
  { name: 'Brienz Dorf', latitude: 46.7539836, longitude: 8.0294492, uic_ref: '8508375' },
]

export const BRIENZERSEE_NAME_MAPPING: Record<string, string> = {
  'Interlaken Ost (See)': 'Interlaken Ost (See)',
  'Interlaken Ost': 'Interlaken Ost (See)',
  'Bönigen': 'Bönigen',
  'Iseltwald (See)': 'Iseltwald (See)',
  'Iseltwald': 'Iseltwald (See)',
  'Giessbach': 'Giessbach',
  'Oberried am Brienzersee (See)': 'Oberried am Brienzersee (See)',
  'Oberried am Brienzersee': 'Oberried am Brienzersee (See)',
  'Oberried': 'Oberried am Brienzersee (See)',
  'Niederried (See)': 'Niederried (See)',
  'Niederried': 'Niederried (See)',
  'Ringgenberg (See)': 'Ringgenberg (See)',
  'Ringgenberg': 'Ringgenberg (See)',
  'Brienz Dorf': 'Brienz Dorf',
  'Brienz': 'Brienz Dorf',

  // Zusätzliche Varianten
  'Interlaken Ost See': 'Interlaken Ost (See)',
  'Iseltwald See': 'Iseltwald (See)',
  'Oberried See': 'Oberried am Brienzersee (See)',
  'Niederried See': 'Niederried (See)',
  'Ringgenberg See': 'Ringgenberg (See)',
}