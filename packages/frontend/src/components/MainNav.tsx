import Link from 'next/link'
import { getGlobalContenutiStatici, getLemmarioContenutiStatici } from '@/lib/payload-api'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { MobileMenu } from '@/components/MobileMenu'

interface MainNavProps {
  lemmarioSlug?: string
  lemmarioId?: number
  lemmarioTitolo?: string
}

export default async function MainNav({ lemmarioSlug, lemmarioId, lemmarioTitolo }: MainNavProps) {
  const contenutiGlobali = await getGlobalContenutiStatici()

  const contenutiLemmario = lemmarioId
    ? await getLemmarioContenutiStatici(lemmarioId)
    : []

  // Build links array for mobile menu
  const mobileLinks: Array<{ href: string; label: string; isLemmarioSpecific?: boolean }> = [
    { href: '/', label: 'Dizionari' },
    ...contenutiGlobali.map((c) => ({
      href: `/pagine/${c.slug}`,
      label: c.titolo,
    })),
  ]

  if (lemmarioSlug) {
    mobileLinks.push({
      href: `/${lemmarioSlug}/bibliografia`,
      label: 'Bibliografia',
      isLemmarioSpecific: true,
    })
    for (const contenuto of contenutiLemmario) {
      mobileLinks.push({
        href: `/${lemmarioSlug}/pagine/${contenuto.slug}`,
        label: contenuto.titolo,
        isLemmarioSpecific: true,
      })
    }
  }

  return (
    <nav className="bg-[var(--color-bg)] sticky top-11 z-40" aria-label="Navigazione principale">
      <div className="container mx-auto px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="label-uppercase link-clean text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Dizionari
            </Link>

            {contenutiGlobali.map((contenuto) => (
              <Link
                key={contenuto.id}
                href={`/pagine/${contenuto.slug}`}
                className="label-uppercase link-clean text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                {contenuto.titolo}
              </Link>
            ))}

            {lemmarioSlug && (
              <>
                <span className="text-[var(--color-border)]" aria-hidden="true">·</span>
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

          {/* Right Side */}
          <div className="flex items-center space-x-2 ml-auto">
            {/* Mobile Menu (hamburger + drawer) */}
            <MobileMenu links={mobileLinks} />

            {/* Theme Toggle (desktop only, mobile is in drawer) */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
