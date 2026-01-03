import Link from 'next/link'

export default function Header() {
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
              href="/lemmari"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Dizionari
            </Link>
            <Link
              href="/lemmi"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Lemmi
            </Link>
            <Link
              href="/ricerca"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Ricerca
            </Link>
            <Link
              href="/informazioni"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Informazioni
            </Link>
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
