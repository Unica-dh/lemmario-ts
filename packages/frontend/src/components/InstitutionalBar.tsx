/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

export default function InstitutionalBar() {
  return (
    <div
      className="institutional-bar bg-[var(--color-bg)] sticky top-0 z-50 overflow-hidden transition-[height,opacity] duration-300 ease-in-out"
      role="banner"
    >
      <Link
        href="/"
        className="container mx-auto px-4 h-11 flex items-center justify-center link-clean"
      >
        {/* UniCa Logo - hidden on mobile */}
        <img
          src="/logos/unica-logo.svg"
          alt="Logo Università degli Studi di Cagliari"
          className="hidden md:block h-3 w-auto mr-3 dark:invert flex-shrink-0"
        />

        <span className="label-uppercase text-[var(--color-text-muted)] whitespace-nowrap text-[0.5625rem] md:text-[0.6875rem]">
          Università degli Studi di Cagliari
          <span className="mx-1.5 md:mx-2" aria-hidden="true">·</span>
          Digital Humanities
        </span>

        {/* DH Logo - hidden on mobile */}
        <img
          src="/logos/dh-logo.svg"
          alt="Logo Digital Humanities"
          className="hidden md:block h-3.5 w-auto ml-3 dark:invert flex-shrink-0"
        />
      </Link>
    </div>
  )
}
