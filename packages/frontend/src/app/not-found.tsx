import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Pagina non trovata
      </h2>
      <p className="text-gray-600 mb-8">
        La pagina che stai cercando non esiste o è stata spostata.
      </p>
      <Link
        href="/"
        className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
      >
        Torna alla home
      </Link>
    </div>
  )
}
