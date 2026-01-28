import { Station } from '../lakes-config'

export const HALLWILERSEE_STATIONS: Station[] = [
  { name: 'Meisterschwanden Delphin', latitude: 47.2960775, longitude: 8.2201404, uic_ref: '8530625' },
  { name: 'Meisterschwanden Seerose', latitude: 47.2840346, longitude: 8.2245347, uic_ref: '8530626' },
  { name: 'Seengen (See)', latitude: 47.3191468, longitude: 8.2025224, uic_ref: '8530627' },
  { name: 'Birrwil (See)', latitude: 47.290872, longitude: 8.2030369, uic_ref: '8530628' },
  { name: 'Beinwil am See (See)', latitude: 47.2694374, longitude: 8.2115908, uic_ref: '8530629' },
  { name: 'Aesch LU (See)', latitude: 47.2585379, longitude: 8.229754, uic_ref: '8530630' },
  { name: 'Mosen (See)', latitude: 47.2459718, longitude: 8.224405, uic_ref: '8530631' },
  { name: 'Boniswil (See)', latitude: 47.3045565, longitude: 8.198824, uic_ref: '8530632' }
]

export const HALLWILERSEE_NAME_MAPPING: Record<string, string> = {
  'Meisterschwanden Delphin': 'meisterschwanden-delphin',
  'Meisterschwanden Seerose': 'meisterschwanden-seerose',
  'Seengen (See)': 'seengen',
  'Seengen': 'seengen',
  'Birrwil (See)': 'birrwil',
  'Birrwil': 'birrwil',
  'Beinwil am See (See)': 'beinwil-am-see',
  'Beinwil am See': 'beinwil-am-see',
  'Aesch LU (See)': 'aesch',
  'Aesch LU': 'aesch',
  'Aesch': 'aesch',
  'Mosen (See)': 'mosen',
  'Mosen': 'mosen',
  'Boniswil (See)': 'boniswil',
  'Boniswil': 'boniswil'
}