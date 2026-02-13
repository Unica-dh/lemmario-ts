import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--color-bg)] border-t border-[var(--color-border)] mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          {/* Column 1: Istituzione */}
          <div>
            <h3 className="label-uppercase text-text-muted mb-2">Istituzione</h3>
            <p className="font-serif italic text-text-body text-lg leading-relaxed">
              Università degli Studi di Cagliari<br />
              Centro Interdipartimentale per l&rsquo;Umanistica Digitale
            </p>
          </div>

          {/* Column 2: Corrispondenza */}
          <div>
            <h3 className="label-uppercase text-text-muted mb-2">Corrispondenza</h3>
            <p className="text-text-body">
              <a 
                href="mailto:dh@unica.it" 
                className="underline hover:text-text transition-colors"
              >
                dh@unica.it
              </a>
            </p>
          </div>
        </div>

        {/* Bottom Row: Copyright and Links */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)] text-center">
          <p className="label-uppercase text-text-muted">
            <span>&copy; {currentYear} UniCa</span>
            <span className="mx-2">·</span>
            <Link href="/privacy" className="link-clean hover:text-text">
              Privacy
            </Link>
            <span className="mx-2">·</span>
            <Link href="/contatti" className="link-clean hover:text-text">
              Contatti
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
