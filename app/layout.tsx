import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zürichsee Schiffsvisualisierung',
  description: 'Live-Schiffspositionen auf dem Zürichsee mit Fahrplan',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
