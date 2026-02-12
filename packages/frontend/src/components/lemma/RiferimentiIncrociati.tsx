import Link from 'next/link'
import type { RiferimentoIncrociato, Lemma } from '@/types/payload'

interface RiferimentiIncrociatiProps {
  riferimenti: Array<RiferimentoIncrociato & { lemma_destinazione?: Lemma }>
  lemmarioSlug: string
}

export function RiferimentiIncrociati({ riferimenti, lemmarioSlug }: RiferimentiIncrociatiProps) {
  if (!riferimenti || riferimenti.length === 0) {
    return null
  }

  return (
    <>
      {riferimenti.map((rif) => {
        const lemma = typeof rif.lemma_destinazione === 'object'
          ? rif.lemma_destinazione
          : null

        if (!lemma) return null

        const tipoLabel = lemma.tipo === 'latino' ? 'lat.' : 'volg.'

        return (
          <Link
            key={rif.id}
            href={`/${lemmarioSlug}/lemmi/${lemma.slug}`}
            className="inline-flex items-center gap-1.5 ml-4 px-3 py-1 text-base font-normal text-purple-700 bg-purple-50 border border-purple-200 rounded-full hover:bg-purple-100 hover:text-purple-900 transition-colors align-middle"
          >
            <span className="italic text-sm">cfr.</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span>{lemma.termine}</span>
            <span className="text-sm text-purple-500">({tipoLabel})</span>
          </Link>
        )
      })}
    </>
  )
}
