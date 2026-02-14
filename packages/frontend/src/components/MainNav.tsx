/* eslint-disable @next/next/no-img-element */
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
    { href: '/', label: 'Home' },
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
    <nav className="main-nav bg-[var(--color-bg)] sticky z-40 transition-[top] duration-300 ease-in-out" aria-label="Navigazione principale">
      <div className="container mx-auto px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-center relative">
          {/* Compact logos - visible only when scrolled (CSS controlled) */}
          <div className="compact-logos absolute left-0 items-center gap-2 hidden">
            <img
              src="/logos/unica-logo.svg"
              alt=""
              className="h-3.5 w-auto dark:invert"
              aria-hidden="true"
            />
            <span className="text-[var(--color-border)] text-xs" aria-hidden="true">&middot;</span>
            <img
              src="/logos/dh-logo.svg"
              alt=""
              className="h-4 w-auto dark:invert"
              aria-hidden="true"
            />
          </div>

          {/* Desktop Navigation Links - centered */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="label-uppercase link-clean text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Home
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
                <span className="text-[var(--color-border)]" aria-hidden="true">&middot;</span>
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

            {/* Theme Toggle (desktop) */}
            <ThemeToggle />
          </div>

          {/* Mobile: hamburger + theme toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <MobileMenu links={mobileLinks} />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
