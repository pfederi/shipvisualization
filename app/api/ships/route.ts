// API Route als Proxy für ZSG Ships API (umgeht CORS)
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_ZSG_API_URL || 'https://vesseldata-api.vercel.app/api/ships'
    
    console.log(`[API Proxy] Lade Daten von: ${apiUrl}`)
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      // Cache-Control Header für Browser-Caching
      cache: 'no-store',
    })
    
    console.log(`[API Proxy] Response Status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[API Proxy] API Fehler: ${response.status} ${response.statusText}`, errorText.slice(0, 200))
      
      // Wenn die API von Vercel Security geblockt wird (403) oder andere Fehler auftreten
      // Wir geben leere Daten zurück, damit die App im Browser nicht crasht
      console.warn(`[API Proxy] Fehler beim Abrufen der Schiffe von ${apiUrl}. Gebe leere Daten zurück.`)
      return NextResponse.json(
        { dailyDeployments: [], lastUpdated: new Date().toISOString(), message: `API Error: ${response.status}` },
        { 
          status: 200, 
          headers: { 
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
          }
        }
      )
    }

    const data = await response.json()
    console.log(`[API Proxy] Daten erfolgreich geladen, ${data.dailyDeployments?.length || 0} Tage gefunden.`)
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('[API Proxy] Fehler beim Abrufen der ZSG-Schiffsdaten:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
    
    // Prüfe ob es ein Netzwerkfehler ist
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          error: 'Verbindungsfehler',
          message: 'Die externe API ist nicht erreichbar. Bitte prüfen Sie die API-URL.',
          details: errorMessage,
        },
        { 
          status: 503,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Abrufen der Schiffsdaten',
        details: errorMessage,
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  }
}

// OPTIONS Handler für Preflight-Requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
