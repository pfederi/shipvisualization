import type { Metadata } from 'next'
import HomeClient from './HomeClient'

// Metadata generation (server-side only)
export const metadata: Metadata = {
  title: 'CH Schifffahrt',
  description: 'Live-Schiffspositionen auf Schweizer Seen mit Fahrplan',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function Home() {
  return <HomeClient />
}
