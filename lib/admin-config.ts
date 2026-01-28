import { promises as fs } from 'fs'
import path from 'path'

const ADMIN_CONFIG_PATH = path.join(process.cwd(), 'data', 'admin-config.json')

export interface AdminConfig {
  enabledLakes: string[]
}

const DEFAULT_CONFIG: AdminConfig = {
  enabledLakes: ['zurichsee'] // Standardmäßig nur Zürichsee aktiviert
}
export async function loadAdminConfig(): Promise<AdminConfig> {
  // PRIORITÄT 1: Dateisystem (funktioniert lokal und auf Vercel beim Build)
  try {
    const data = await fs.readFile(ADMIN_CONFIG_PATH, 'utf-8')
    // Entferne JSON-Kommentare (für bessere Developer Experience)
    const cleanedData = data.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    return JSON.parse(cleanedData)
  } catch (error) {
    // Wenn die Datei nicht existiert, versuche Umgebungsvariable (Fallback)
    if (process.env.ADMIN_ENABLED_LAKES) {
      const enabledLakes = process.env.ADMIN_ENABLED_LAKES.split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0)
      return { enabledLakes }
    }

    // Erstelle Standard-Konfiguration (nur lokal)
    if (process.env.NODE_ENV !== 'production') {
      try {
        await saveAdminConfig(DEFAULT_CONFIG)
      } catch (e) {
        // Ignoriere Fehler beim Erstellen der Datei
      }
    }
    return DEFAULT_CONFIG
  }
}
export async function saveAdminConfig(config: AdminConfig): Promise<void> {
  // Diese Funktion wird nicht mehr verwendet - Datei wird direkt bearbeitet
  // Behalten für Kompatibilität, falls jemand sie noch aufruft
  try {
    const dir = path.dirname(ADMIN_CONFIG_PATH)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(ADMIN_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      throw error
    }
  }
}

/**
 * Prüft, ob ein See aktiviert ist
 */
export async function isLakeEnabled(lakeId: string): Promise<boolean> {
  const config = await loadAdminConfig()
  return config.enabledLakes.includes(lakeId)
}

/**
 * Gibt alle aktivierten Seen zurück
 */
export async function getEnabledLakes(): Promise<string[]> {
  const config = await loadAdminConfig()
  return config.enabledLakes
}
