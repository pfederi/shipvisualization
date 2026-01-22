// Koordinaten der Schiffsstationen am Zürichsee
// Basierend auf: https://github.com/pfederi/Next-Wave/blob/main/Next%20Wave/Data/stations.json

export interface Station {
  name: string
  latitude: number
  longitude: number
  uic_ref?: string
}

// Stationen des Zürichsees mit korrekten Koordinaten aus dem JSON
export const ZURICHSEE_STATIONS: Station[] = [
  { name: 'Zürich Bürkliplatz (See)', latitude: 47.365662, longitude: 8.541005, uic_ref: '8503651' },
  { name: 'Zürich Wollishofen (See)', latitude: 47.345465, longitude: 8.536657, uic_ref: '8503681' },
  { name: 'Kilchberg ZH (See)', latitude: 47.322553, longitude: 8.551782, uic_ref: '8503677' },
  { name: 'Rüschlikon (See)', latitude: 47.309769, longitude: 8.55838, uic_ref: '8503675' },
  { name: 'Thalwil (See)', latitude: 47.296677, longitude: 8.568049, uic_ref: '8503674' },
  { name: 'Oberrieden (See)', latitude: 47.278604, longitude: 8.581836, uic_ref: '8503673' },
  { name: 'Horgen (See)', latitude: 47.261887, longitude: 8.59752, uic_ref: '8503672' },
  { name: 'Halbinsel Au', latitude: 47.250414, longitude: 8.648663, uic_ref: '8503671' },
  { name: 'Wädenswil (See)', latitude: 47.230133, longitude: 8.675343, uic_ref: '8503670' },
  { name: 'Richterswil (See)', latitude: 47.209095, longitude: 8.707292, uic_ref: '8503669' },
  { name: 'Pfäffikon SZ (See)', latitude: 47.207941, longitude: 8.775131, uic_ref: '8503680' },
  { name: 'Altendorf Seestatt', latitude: 47.194891, longitude: 8.832481, uic_ref: '8503683' },
  { name: 'Lachen SZ (See)', latitude: 47.193649, longitude: 8.850226, uic_ref: '8503648' },
  { name: 'Schmerikon (See)', latitude: 47.224573, longitude: 8.940312, uic_ref: '8503647' },
  { name: 'Rapperswil SG (See)', latitude: 47.225705, longitude: 8.813555, uic_ref: '8503667' },
  { name: 'Insel Ufenau', latitude: 47.218035, longitude: 8.776638, uic_ref: '8503668' },
  { name: 'Uerikon (See)', latitude: 47.233487, longitude: 8.758165, uic_ref: '8503666' },
  { name: 'Stäfa (See)', latitude: 47.238703, longitude: 8.718443, uic_ref: '8503665' },
  { name: 'Männedorf (See)', latitude: 47.252789, longitude: 8.689093, uic_ref: '8503664' },
  { name: 'Meilen (See)', latitude: 47.267547, longitude: 8.640329, uic_ref: '8503661' },
  { name: 'Herrliberg (See)', latitude: 47.283303, longitude: 8.6095295, uic_ref: '8503661' },
  { name: 'Erlenbach ZH (See)', latitude: 47.303025, longitude: 8.589302, uic_ref: '8503659' },
  { name: 'Küsnacht ZH Heslibach', latitude: 47.308399, longitude: 8.584392, uic_ref: '8503682' },
  { name: 'Küsnacht ZH (See)', latitude: 47.318993, longitude: 8.578297, uic_ref: '8503657' },
  { name: 'Zollikon (See)', latitude: 47.339069, longitude: 8.567424, uic_ref: '8503655' },
  { name: 'Zürich Tiefenbrunnen (See)', latitude: 47.349858, longitude: 8.560585, uic_ref: '8505332' },
  { name: 'Zürichhorn (See)', latitude: 47.35262, longitude: 8.553125, uic_ref: '8503653' },
]

// Mapping für verschiedene Namensvarianten (Transport API verwendet manchmal andere Namen)
const STATION_NAME_MAPPING: Record<string, string> = {
  'Zürich Bürkliplatz': 'Zürich Bürkliplatz (See)',
  'Zürich Tiefenbrunnen': 'Zürich Tiefenbrunnen (See)',
  'Küsnacht': 'Küsnacht ZH (See)',
  'Küsnacht ZH': 'Küsnacht ZH (See)',
  'Erlenbach': 'Erlenbach ZH (See)',
  'Erlenbach ZH': 'Erlenbach ZH (See)',
  'Herrliberg': 'Herrliberg (See)',
  'Meilen': 'Meilen (See)',
  'Uetikon': 'Uerikon (See)',
  'Männedorf': 'Männedorf (See)',
  'Stäfa': 'Stäfa (See)',
  'Rapperswil': 'Rapperswil SG (See)',
  'Horgen': 'Horgen (See)',
  'Wädenswil': 'Wädenswil (See)',
  'Thalwil': 'Thalwil (See)',
  'Richterswil': 'Richterswil (See)',
  'Pfäffikon': 'Pfäffikon SZ (See)',
  'Lachen': 'Lachen SZ (See)',
  'Schmerikon': 'Schmerikon (See)',
  'Zollikon': 'Zollikon (See)',
  'Kilchberg': 'Kilchberg ZH (See)',
  'Kilchberg ZH': 'Kilchberg ZH (See)',
  'Rüschlikon': 'Rüschlikon (See)',
  'Zürich Wollishofen': 'Zürich Wollishofen (See)',
  'Zürichhorn': 'Zürichhorn (See)',
}

export function normalizeStationName(name: string): string {
  return STATION_NAME_MAPPING[name] || name
}

export function getStationCoordinates(): Map<string, { lat: number; lon: number }> {
  const map = new Map()
  ZURICHSEE_STATIONS.forEach(station => {
    map.set(station.name, { lat: station.latitude, lon: station.longitude })
    
    // Wir mappen auch Varianten ohne (See), aber nur für den Lookup, 
    // falls die API unvollständige Namen liefert.
    const nameWithoutSuffix = station.name.replace(' (See)', '')
    if (!map.has(nameWithoutSuffix)) {
      map.set(nameWithoutSuffix, { lat: station.latitude, lon: station.longitude })
    }
  })
  return map
}
