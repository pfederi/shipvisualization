import { Station } from '../lakes-config'

export const LUGANERSEE_STATIONS: Station[] = [
  // Bucht von Lugano
  { name: 'Lugano Centrale (lago)', latitude: 46.002959, longitude: 8.951545, uic_ref: '8505550' },
  { name: 'Cassarate (lago)', latitude: 46.005132, longitude: 8.969822, uic_ref: '8587842' },
  { name: 'Paradiso (lago)', latitude: 45.993252, longitude: 8.946745, uic_ref: '8505553' },

  // Richtung Gandria (Ostufer)
  { name: 'S. Rocco (lago)', latitude: 45.985155, longitude: 8.979976, uic_ref: '8505543' },
  { name: 'Grotto Pescatori (lago)', latitude: 45.990026, longitude: 8.993395, uic_ref: '8505544' },
  { name: 'Grotto Elvezia (lago)', latitude: 46.003937, longitude: 8.993287, uic_ref: '8505541' },
  { name: 'Gandria (lago)', latitude: 46.005535, longitude: 9.003945, uic_ref: '8505551' },
  { name: 'Cantine di Gandria (lago)', latitude: 45.998354, longitude: 9.016959, uic_ref: '8505545' },
  { name: 'Museo doganale svizzero (lago)', latitude: 45.999412, longitude: 9.021082, uic_ref: '8505656' },

  // Richtung Melide / Süd
  { name: 'Campione (lago)', latitude: 45.968929, longitude: 8.970384, uic_ref: '1300106' },
  { name: 'Melide Swissminiatur (lago)', latitude: 45.952785, longitude: 8.954698, uic_ref: '8505535' },
  { name: 'Bissone (lago)', latitude: 45.949812, longitude: 8.964277, uic_ref: '8505650' },
  { name: 'Maroggia (lago)', latitude: 45.935723, longitude: 8.968281, uic_ref: '8531259' },
  { name: 'Brusino Arsizio (lago)', latitude: 45.929923, longitude: 8.937975, uic_ref: '8505556' },
  { name: 'Brusino Arsizio Funivia (lago)', latitude: 45.924436, longitude: 8.934498, uic_ref: '8505536' },
  { name: 'Morcote (lago)', latitude: 45.922731, longitude: 8.917138, uic_ref: '8505557' },
  { name: 'Porto Ceresio (lago)', latitude: 45.903927, longitude: 8.900664, uic_ref: '1300112' },

  // Richtung Ponte Tresa (Westufer)
  { name: 'Caslano (lago)', latitude: 45.96983, longitude: 8.883922, uic_ref: '8505674' },
  { name: 'Ponte Tresa (lago)', latitude: 45.967384, longitude: 8.859808, uic_ref: '8505677' },
  { name: 'Ponte Tresa (Italia) (lago)', latitude: 45.965345, longitude: 8.858826, uic_ref: '1300110' },

  // Haben gültige Live-IDs, zeigen aber aktuell keine planmässigen Kurse
  // in transport.opendata.ch (ggf. saisonal/reduziert)
  { name: 'Gandria Confine (lago)', latitude: 46.015023, longitude: 9.019713, uic_ref: '8505538' },
  { name: 'Porlezza (lago)', latitude: 46.033887, longitude: 9.118786, uic_ref: '1300111' },
]

export const LUGANERSEE_NAME_MAPPING: Record<string, string> = {
  // Direkte Namen aus der API
  'Lugano Centrale (lago)': 'Lugano Centrale (lago)',
  'Cassarate (lago)': 'Cassarate (lago)',
  'Paradiso (lago)': 'Paradiso (lago)',
  'S. Rocco (lago)': 'S. Rocco (lago)',
  'Grotto Pescatori (lago)': 'Grotto Pescatori (lago)',
  'Grotto Elvezia (lago)': 'Grotto Elvezia (lago)',
  'Gandria (lago)': 'Gandria (lago)',
  'Cantine di Gandria (lago)': 'Cantine di Gandria (lago)',
  'Museo doganale svizzero (lago)': 'Museo doganale svizzero (lago)',
  'Campione (lago)': 'Campione (lago)',
  'Melide Swissminiatur (lago)': 'Melide Swissminiatur (lago)',
  'Bissone (lago)': 'Bissone (lago)',
  'Maroggia (lago)': 'Maroggia (lago)',
  'Brusino Arsizio (lago)': 'Brusino Arsizio (lago)',
  'Brusino Arsizio Funivia (lago)': 'Brusino Arsizio Funivia (lago)',
  'Morcote (lago)': 'Morcote (lago)',
  'Porto Ceresio (lago)': 'Porto Ceresio (lago)',
  'Caslano (lago)': 'Caslano (lago)',
  'Ponte Tresa (lago)': 'Ponte Tresa (lago)',
  'Ponte Tresa (Italia) (lago)': 'Ponte Tresa (Italia) (lago)',
  'Gandria Confine (lago)': 'Gandria Confine (lago)',
  'Porlezza (lago)': 'Porlezza (lago)',

  // Basisnamen (Fallback für verschiedene API-Varianten)
  'Lugano': 'Lugano Centrale (lago)',
  'Lugano Centrale': 'Lugano Centrale (lago)',
  'Cassarate': 'Cassarate (lago)',
  'Paradiso': 'Paradiso (lago)',
  'Gandria': 'Gandria (lago)',
  'Cantine di Gandria': 'Cantine di Gandria (lago)',
  'Campione': 'Campione (lago)',
  'Melide': 'Melide Swissminiatur (lago)',
  'Bissone': 'Bissone (lago)',
  'Maroggia': 'Maroggia (lago)',
  'Brusino Arsizio': 'Brusino Arsizio (lago)',
  'Morcote': 'Morcote (lago)',
  'Porto Ceresio': 'Porto Ceresio (lago)',
  'Caslano': 'Caslano (lago)',
  'Ponte Tresa': 'Ponte Tresa (lago)',
  'Porlezza': 'Porlezza (lago)',
}
