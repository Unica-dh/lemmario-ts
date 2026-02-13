import type { Fonte } from '@/types/payload'

interface FonteCardProps {
  fonte: Fonte
  ricorrenzeCount: number
}

export function FonteCard({ fonte, ricorrenzeCount }: FonteCardProps) {
  const descrizione = fonte.riferimento_completo || fonte.titolo

  return (
    <article className="py-5">
      <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">
        {fonte.shorthand_id}
      </h3>
      {descrizione && (
        <p className="font-sans text-sm text-[var(--color-text-body)] mt-1 leading-relaxed">
          {descrizione}
        </p>
      )}
      {ricorrenzeCount > 0 && (
        <p className="label-uppercase text-[var(--color-text-muted)] mt-2">
          {ricorrenzeCount} ricorrenz{ricorrenzeCount === 1 ? 'a' : 'e'}
        </p>
      )}
    </article>
  )
}
