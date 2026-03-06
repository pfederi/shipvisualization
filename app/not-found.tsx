import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Seite nicht gefunden</p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Zur Startseite
      </Link>
    </div>
  )
}
