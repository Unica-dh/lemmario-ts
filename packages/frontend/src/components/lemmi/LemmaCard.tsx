import Link from 'next/link'

interface LemmaCardProps {
  termine: string
  slug: string
  tipo: 'latino' | 'volgare'
  lemmarioSlug: string
  definitionPreview?: string
  defCount?: number
  fontiCount?: number
  ricorrenzeCount?: number
}

export function LemmaCard({
  termine,
  slug,
  tipo,
  lemmarioSlug,
  definitionPreview,
  defCount = 0,
  fontiCount = 0,
  ricorrenzeCount = 0,
}: LemmaCardProps) {
  return (
    <Link
      href={`/${lemmarioSlug}/lemmi/${slug}`}
      className="block group transition-colors duration-200 hover:bg-[var(--color-bg-subtle)]"
      data-testid="lemma-card"
    >
      <article className="py-5 px-4">
        {/* Header: Termine + Badge Tipo */}
        <div className="flex items-start justify-between mb-2">
          <h2 className="font-serif font-bold text-2xl text-[var(--color-text)]">
            {termine}
          </h2>
          <span className="label-uppercase text-[var(--color-text-muted)] ml-4 mt-1 shrink-0">
            {tipo === 'latino' ? 'Latine' : 'Volgare'}
          </span>
        </div>

        {/* Metadata line */}
        <div className="label-uppercase text-[var(--color-text-muted)] mb-3">
          {defCount} def.
          {fontiCount > 0 && <> &middot; {fontiCount} fonti</>}
          {ricorrenzeCount > 0 && <> &middot; {ricorrenzeCount} ricorrenze</>}
        </div>

        {/* Definition preview */}
        {definitionPreview && (
          <p className="font-sans text-sm text-[var(--color-text-body)] line-clamp-3">
            {definitionPreview}
          </p>
        )}
      </article>
    </Link>
  )
}
