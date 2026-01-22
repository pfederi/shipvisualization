export type Language = 'de' | 'en'

export const translations = {
  de: {
    title: 'Zürichsee Schifffahrt',
    activeShips: 'Aktive Schiffe',
    loadingSchedule: 'Fahrplan-Daten werden geladen...',
    loadingSubtext: 'Dies kann einige Sekunden dauern',
    noActiveShips: 'Keine aktiven Schiffe',
    departure: 'Abfahrt',
    arrival: 'Ankunft',
    course: 'Kurs',
    unknownShip: 'Unbekanntes Schiff',
    liveMode: 'Live',
    simulationMode: 'Simulation',
    reset: 'Reset',
    speed: 'Geschwindigkeit',
    date: 'Datum',
    time: 'Zeit',
    madeWithAI: 'Made with AI',
    createdBy: 'Created by',
    version: 'v.1.0.0',
    shipNamesWarning: 'Schiffsnamen erst kurzfristig verfügbar.',
  },
  en: {
    title: 'Lake Zurich Ferry Tracker',
    activeShips: 'Active Ships',
    loadingSchedule: 'Loading schedule data...',
    loadingSubtext: 'This may take a few seconds',
    noActiveShips: 'No active ships',
    departure: 'Departure',
    arrival: 'Arrival',
    course: 'Course',
    unknownShip: 'Unknown Ship',
    liveMode: 'Live',
    simulationMode: 'Simulation',
    reset: 'Reset',
    speed: 'Speed',
    date: 'Date',
    time: 'Time',
    madeWithAI: 'Made with AI',
    createdBy: 'Created by',
    version: 'v.1.0.0',
    shipNamesWarning: 'Ship names only available short-term.',
  },
} as const

export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'de'
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('en')) return 'en'
  return 'de'
}

export function getTranslations(lang: Language) {
  return translations[lang]
}

// Type for translations that accepts both languages
// Use Record to create a type that describes the structure without specific string literals
export type Translations = Record<keyof typeof translations.de, string>
