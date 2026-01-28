import { NextResponse } from 'next/server'
import { getEnabledLakes } from '@/lib/admin-config'

/**
 * Öffentliche API-Route zum Abrufen der aktivierten Seen
 * Keine Authentifizierung erforderlich
 */
export async function GET() {
  try {
    const enabledLakes = await getEnabledLakes()
    return NextResponse.json({ enabledLakes })
  } catch (error) {
    console.error('Error loading enabled lakes:', error)
    // Fallback: Alle Seen aktiviert, wenn Konfiguration nicht verfügbar
    return NextResponse.json({ enabledLakes: [] })
  }
}
