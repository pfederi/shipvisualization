import { Station } from '../lakes-config'

// Eigener Kartenausschnitt nur für den Rhein-Abschnitt der URh-Linie
// (Untersee und Rhein) zwischen Schaffhausen und Stein am Rhein.
// Dieselben Stationen sind auch Teil von BODENSEE_STATIONS.
export const RHEINSCHAFFHAUSEN_STATIONS: Station[] = [
  { name: 'Schaffhausen (Schifflände)', latitude: 47.69528, longitude: 8.641007, uic_ref: '8506150' },
  { name: 'Büsingen (Schifflände)', latitude: 47.69542, longitude: 8.693313, uic_ref: '1101322' },
  { name: 'Diessenhofen (Schifflände)', latitude: 47.690409, longitude: 8.748851, uic_ref: '8506152' },
  { name: 'Stein am Rhein (Schifflände)', latitude: 47.659902, longitude: 8.856645, uic_ref: '8506153' },
]

export const RHEINSCHAFFHAUSEN_NAME_MAPPING: Record<string, string> = {
  'Schaffhausen (Schifflände)': 'Schaffhausen (Schifflände)',
  'Büsingen (Schifflände)': 'Büsingen (Schifflände)',
  'Diessenhofen (Schifflände)': 'Diessenhofen (Schifflände)',
  'Stein am Rhein (Schifflände)': 'Stein am Rhein (Schifflände)',

  'Schaffhausen': 'Schaffhausen (Schifflände)',
  'Büsingen': 'Büsingen (Schifflände)',
  'Diessenhofen': 'Diessenhofen (Schifflände)',
  'Stein am Rhein': 'Stein am Rhein (Schifflände)',
}
