import Link from 'next/link'
import { getGlobalContenutiStatici, getLemmarioContenutiStatici } from '@/lib/payload-api'

interface HeaderProps {
  lemmarioSlug?: string
  lemmarioId?: number
  lemmarioTitolo?: string
}

export default async function Header({ lemmarioSlug, lemmarioId, lemmarioTitolo }: HeaderProps) {
  const contenutiGlobali = await getGlobalContenutiStatici()

  // Fetch lemmario-specific content if we're in a lemmario context
  const contenutiLemmario = lemmarioId
    ? await getLemmarioContenutiStatici(lemmarioId)
    : []

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-primary-700">
              Lemmario
            </h1>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Dizionari
            </Link>

            {/* Global static content links */}
            {contenutiGlobali.map((contenuto) => (
              <Link
                key={contenuto.id}
                href={`/pagine/${contenuto.slug}`}
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                {contenuto.titolo}
              </Link>
            ))}

            {/* Lemmario-specific static content links (with different color) */}
            {contenutiLemmario.length > 0 && lemmarioSlug && (
              <>
                <span className="text-gray-300">|</span>
                {contenutiLemmario.map((contenuto) => (
                  <Link
                    key={contenuto.id}
                    href={`/${lemmarioSlug}/pagine/${contenuto.slug}`}
                    className="text-primary-600 hover:text-primary-800 transition-colors font-medium"
                    title={`Contenuto specifico per ${lemmarioTitolo || 'questo lemmario'}`}
                  >
                    {contenuto.titolo}
                  </Link>
                ))}
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <button
              className="md:hidden text-gray-600 hover:text-primary-600"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
