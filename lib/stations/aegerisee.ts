import { Station } from '../lakes-config'

export const AEGERISEE_STATIONS: Station[] = [
  // Sortiert in Rundfahrt-Reihenfolge (gegen Uhrzeigersinn)
  { name: 'Unterägeri (See)', latitude: 47.138044, longitude: 8.58933, uic_ref: '8530742' },
  { name: 'Naas (See)', latitude: 47.114356, longitude: 8.621396, uic_ref: '8530636' },
  { name: 'Oberägeri (See)', latitude: 47.133554, longitude: 8.608124, uic_ref: '8530743' },
  { name: 'Oberägeri Ländli (See)', latitude: 47.129543, longitude: 8.62997, uic_ref: '8530857' },
  { name: 'Eierhals (See)', latitude: 47.116142, longitude: 8.640873, uic_ref: '8530633' },
  { name: 'Morgarten Denkmal (See)', latitude: 47.106161, longitude: 8.641295, uic_ref: '8530634' },
  { name: 'Morgarten Hotel (See)', latitude: 47.103791, longitude: 8.640029, uic_ref: '8530635' },
]

export const AEGERISEE_NAME_MAPPING: Record<string, string> = {
  // Direkte Namen aus der API
  'Unterägeri (See)': 'Unterägeri (See)',
  'Oberägeri (See)': 'Oberägeri (See)',
  'Oberägeri Ländli (See)': 'Oberägeri Ländli (See)',
  'Eierhals (See)': 'Eierhals (See)',
  'Morgarten Denkmal (See)': 'Morgarten Denkmal (See)',
  'Morgarten Hotel (See)': 'Morgarten Hotel (See)',
  'Naas (See)': 'Naas (See)',

  // Basisnamen (Fallback für verschiedene API-Varianten)
  'Unterägeri': 'Unterägeri (See)',
  'Oberägeri': 'Oberägeri (See)',
  'Oberägeri Ländli': 'Oberägeri Ländli (See)',
  'Eierhals': 'Eierhals (See)',
  'Morgarten Denkmal': 'Morgarten Denkmal (See)',
  'Morgarten Hotel': 'Morgarten Hotel (See)',
  'Naas': 'Naas (See)',

  // Zusätzliche Varianten
  'Unterägeri See': 'Unterägeri (See)',
  'Oberägeri See': 'Oberägeri (See)',
  'Eierhals See': 'Eierhals (See)',
  'Morgarten': 'Morgarten Denkmal (See)',
  'Naas See': 'Naas (See)',
}