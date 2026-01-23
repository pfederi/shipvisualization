import { Station } from '../lakes-config'

export const VIERWALDSTAETTERSEE_STATIONS: Station[] = [
  // Schiffsstationen des Vierwaldstättersees (SGV)
  { name: 'Luzern (See)', latitude: 47.0503, longitude: 8.3121, uic_ref: '8591532' },
  { name: 'Weggis (See)', latitude: 47.0315, longitude: 8.4342, uic_ref: '8591533' },
  { name: 'Vitznau (See)', latitude: 47.0094, longitude: 8.4839, uic_ref: '8591534' },
  { name: 'Beckenried (See)', latitude: 46.9669, longitude: 8.4746, uic_ref: '8591535' },
  { name: 'Gersau (See)', latitude: 46.9904, longitude: 8.5239, uic_ref: '8591536' },
  { name: 'Brunnen (See)', latitude: 46.9947, longitude: 8.6083, uic_ref: '8591537' },
  { name: 'Flüelen (See)', latitude: 46.9014, longitude: 8.6236, uic_ref: '8591538' },
  { name: 'Alpnachstad (See)', latitude: 46.9547, longitude: 8.2778, uic_ref: '8591539' },
  { name: 'Stansstad (See)', latitude: 46.9774, longitude: 8.3411, uic_ref: '8591540' },
  { name: 'Kehrsiten-Bürgenstock (See)', latitude: 46.9984, longitude: 8.3756, uic_ref: '8591541' },
  { name: 'Küssnacht am Rigi (See)', latitude: 47.0819, longitude: 8.4358, uic_ref: '8591542' },
  { name: 'Treib (See)', latitude: 46.9904, longitude: 8.5833, uic_ref: '8591543' },
  { name: 'Hergiswil NW (See)', latitude: 46.9833, longitude: 8.3167, uic_ref: '8591544' },
  { name: 'Buochs (See)', latitude: 46.9789, longitude: 8.4194, uic_ref: '8591545' },
  { name: 'Ennetbürgen (See)', latitude: 46.9856, longitude: 8.4111, uic_ref: '8591546' },
]

export const VIERWALDSTAETTERSEE_NAME_MAPPING: Record<string, string> = {
  'Luzern': 'Luzern (See)',
  'Luzern Bahnhofquai': 'Luzern (See)',
  'Weggis': 'Weggis (See)',
  'Vitznau': 'Vitznau (See)',
  'Beckenried': 'Beckenried (See)',
  'Gersau': 'Gersau (See)',
  'Brunnen': 'Brunnen (See)',
  'Flüelen': 'Flüelen (See)',
  'Alpnachstad': 'Alpnachstad (See)',
  'Stansstad': 'Stansstad (See)',
  'Kehrsiten-Bürgenstock': 'Kehrsiten-Bürgenstock (See)',
  'Küssnacht am Rigi': 'Küssnacht am Rigi (See)',
  'Treib': 'Treib (See)',
  'Hergiswil NW': 'Hergiswil NW (See)',
  'Hergiswil': 'Hergiswil NW (See)',
  'Buochs': 'Buochs (See)',
  'Ennetbürgen': 'Ennetbürgen (See)',
}
