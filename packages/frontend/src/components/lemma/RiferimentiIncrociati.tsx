import Link from 'next/link'
import type { RiferimentoIncrociato, Lemma } from '@/types/payload'

interface RiferimentiIncrociatiProps {
  riferimenti: Array<RiferimentoIncrociato & { lemma_destinazione?: Lemma }>
  lemmarioSlug: string
  showLabel?: boolean
}

const TIPO_LABELS: Record<string, string> = {
  CFR: 'CFR',
  VEDI: 'VEDI',
  VEDI_ANCHE: 'VEDI ANCHE',
}

export function RiferimentiIncrociati({ riferimenti, lemmarioSlug, showLabel = true }: RiferimentiIncrociatiProps) {
  if (!riferimenti || riferimenti.length === 0) {
    return null
  }

  const grouped = new Map<string, Array<RiferimentoIncrociato & { lemma_destinazione?: Lemma }>>()
  for (const rif of riferimenti) {
    const tipo = rif.tipo_riferimento || 'CFR'
    const existing = grouped.get(tipo) || []
    existing.push(rif)
    grouped.set(tipo, existing)
  }

  return (
    <section>
      {showLabel && (
        <h2 className="label-uppercase text-[var(--color-text-muted)] mb-4">
          Riferimenti
        </h2>
      )}
      <div className="space-y-3">
        {Array.from(grouped.entries()).map(([tipo, refs]) => (
          <div key={tipo} className="flex flex-wrap items-baseline gap-x-1">
            <span className="label-uppercase text-[var(--color-text-muted)] mr-2">
              {TIPO_LABELS[tipo] || tipo}
            </span>
            {refs.map((rif, idx) => {
              const lemma = typeof rif.lemma_destinazione === 'object'
                ? rif.lemma_destinazione
                : null

              if (!lemma) return null

              return (
                <span key={rif.id}>
                  <Link
                    href={`/${lemmarioSlug}/lemmi/${lemma.slug}`}
                    className="font-serif text-[var(--color-text)] hover:text-[var(--color-text-muted)] transition-colors"
                  >
                    &rarr; {lemma.termine}
                  </Link>
                  {idx < refs.length - 1 && (
                    <span className="text-[var(--color-text-muted)]">, </span>
                  )}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}
