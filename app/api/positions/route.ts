import { NextRequest, NextResponse } from 'next/server'
import { LAKES } from '@/lib/lakes-config'
import { getLakePositions } from '@/lib/positions.server'

export const dynamic = 'force-dynamic'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }

/** GET /api/positions?lake=zurichsee → { updatedAt, ships: [...], nextDeparture } */
export async function GET(req: NextRequest) {
  const lake = req.nextUrl.searchParams.get('lake') ?? 'zurichsee'
  if (!LAKES[lake]) return NextResponse.json({ error: 'unknown lake' }, { status: 400, headers: CORS })
  try {
    const body = await getLakePositions(lake)
    return NextResponse.json(body, { headers: { ...CORS, 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' } })
  } catch (err) {
    console.error('positions failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'upstream failed' }, { status: 502, headers: CORS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}
