import Link from 'next/link'
import type { Fonte } from '@/types/payload'

interface LemmaRef {
  id: number
  slug: string
  termine: string
}

interface FonteCardProps {
  fonte: Fonte
  ricorrenzeCount: number
  lemmiAssociati?: LemmaRef[]
  lemmarioSlug?: string
}

export function FonteCard({ fonte, ricorrenzeCount, lemmiAssociati, lemmarioSlug }: FonteCardProps) {
  return (
    <article id={`fonte-${fonte.id}`} className="py-5">
      <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">
        {fonte.titolo || fonte.shorthand_id}
      </h3>
      {fonte.riferimento_completo && (
        <p className="font-sans text-sm text-[var(--color-text-body)] mt-1 leading-relaxed">
          {fonte.riferimento_completo}
        </p>
      )}
      {ricorrenzeCount > 0 && (
        <p className="label-uppercase text-[var(--color-text-muted)] mt-2">
          {ricorrenzeCount} ricorrenz{ricorrenzeCount === 1 ? 'a' : 'e'}
        </p>
      )}
      {lemmiAssociati && lemmiAssociati.length > 0 && lemmarioSlug && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="label-uppercase text-[var(--color-text-muted)] self-center mr-1">
            Lemmi:
          </span>
          {lemmiAssociati.map((lemma, idx) => (
            <span key={lemma.id}>
              <Link
                href={`/${lemmarioSlug}/lemmi/${lemma.slug}`}
                className="text-sm font-serif text-[var(--color-text)] hover:text-[var(--color-text-muted)] transition-colors underline decoration-dotted underline-offset-2"
              >
                {lemma.termine}
              </Link>
              {idx < lemmiAssociati.length - 1 && (
                <span className="text-[var(--color-text-muted)]">, </span>
              )}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
