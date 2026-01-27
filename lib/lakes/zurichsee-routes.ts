import { ShipRouteData } from '../geojson-routes'

/**
 * Zürichsee-spezifische Route-Findung
 * Spezialfall: Wädenswil-Shuttle (Kurs 3733)
 */
export function getZurichseeRouteBonus(
  routeName: string,
  courseNumber?: string
): number {
  // Extra-Bonus für Wädenswil-Shuttle (Kurs 3733)
  if (courseNumber === "3733" && 
      (routeName.includes("3733") || 
       routeName.includes("männedorf") || 
       routeName.includes("stäfa") || 
       routeName.includes("wädenswil"))) {
    return 50000 // Riesiger Bonus für den Wädenswil-Shuttle
  }
  return 0
}

export function shouldDebugZurichseeRoute(
  courseNumber?: string,
  internalCourseNumber?: string
): boolean {
  return courseNumber === "3733" || internalCourseNumber === "3733"
}
