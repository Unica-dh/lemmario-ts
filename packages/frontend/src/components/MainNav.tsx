import Link from 'next/link'
import { getGlobalContenutiStatici, getLemmarioContenutiStatici } from '@/lib/payload-api'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

interface MainNavProps {
  lemmarioSlug?: string
  lemmarioId?: number
  lemmarioTitolo?: string
}

export default async function MainNav({ lemmarioSlug, lemmarioId, lemmarioTitolo }: MainNavProps) {
  const contenutiGlobali = await getGlobalContenutiStatici()

  // Fetch lemmario-specific content if we're in a lemmario context
  const contenutiLemmario = lemmarioId
    ? await getLemmarioContenutiStatici(lemmarioId)
    : []

  return (
    <nav className="bg-[var(--color-bg)] sticky top-11 z-40">
      <div className="container mx-auto px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="label-uppercase link-clean text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Dizionari
            </Link>

            {/* Global static content links */}
            {contenutiGlobali.map((contenuto) => (
              <Link
                key={contenuto.id}
                href={`/pagine/${contenuto.slug}`}
                className="label-uppercase link-clean text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                {contenuto.titolo}
              </Link>
            ))}

            {/* Lemmario-specific links */}
            {lemmarioSlug && (
              <>
                <span className="text-[var(--color-border)]">·</span>
                <Link
                  href={`/${lemmarioSlug}/bibliografia`}
                  className="label-uppercase link-clean text-[var(--color-text)] hover:text-[var(--color-text-body)] font-medium"
                >
                  Bibliografia
                </Link>
                {contenutiLemmario.map((contenuto) => (
                  <Link
                    key={contenuto.id}
                    href={`/${lemmarioSlug}/pagine/${contenuto.slug}`}
                    className="label-uppercase link-clean text-[var(--color-text)] hover:text-[var(--color-text-body)] font-medium"
                    title={`Contenuto specifico per ${lemmarioTitolo || 'questo lemmario'}`}
                  >
                    {contenuto.titolo}
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Right Side: Mobile Menu + Theme Toggle */}
          <div className="flex items-center space-x-4 ml-auto">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
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

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
