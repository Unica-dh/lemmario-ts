import Link from 'next/link'
import type { Metadata } from 'next'
import { getLemmi, getLemmari } from '@/lib/payload-api'
import { RicercaSearchInput } from '@/components/search/RicercaSearchInput'
import { FadeIn } from '@/components/animations/FadeIn'
import type { Lemma, Lemmario } from '@/types/payload'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ricerca Avanzata',
  description: 'Cerca tra i lemmi dei glossari storici della terminologia matematica ed economica italiana. Filtra per lingua, dizionario e periodo storico.',
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
  openGraph: {
    title: 'Ricerca Avanzata - Glossari UniCa',
    description: 'Cerca tra i lemmi dei glossari storici della terminologia matematica ed economica italiana.',
    type: 'website',
  },
}

interface PageProps {
  searchParams: {
    q?: string
    tipo?: 'latino' | 'volgare'
    lemmario?: string
    page?: string
  }
}

export default async function RicercaPage({ searchParams }: PageProps) {
  const query = searchParams.q || ''
  const tipo = searchParams.tipo
  const lemmarioId = searchParams.lemmario ? parseInt(searchParams.lemmario) : undefined
  const page = parseInt(searchParams.page || '1')

  // Carica tutti i lemmari per il filtro
  const lemmariData = await getLemmari({ limit: 100 })

  // Pick sample terms for typewriter
  const sampleLemmi = await getLemmi({ limit: 20, page: 1, depth: 0 })
  const sampleTerms = [...sampleLemmi.docs]
    .sort(() => Math.random() - 0.5)
    .slice(0, 6)
    .map((l) => l.termine)

  // Esegui la ricerca solo se c'è una query
  let lemmiData = null
  if (query) {
    const where: Record<string, unknown> = {
      termine: { contains: query },
    }
    if (tipo) {
      where.tipo = { equals: tipo }
    }
    if (lemmarioId) {
      where.lemmario = { equals: lemmarioId }
    }

    lemmiData = await getLemmi({
      limit: 20,
      page,
      where,
      depth: 1,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <FadeIn direction="up">
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[var(--color-text)] mb-4">Ricerca Avanzata</h1>
          <p className="text-[var(--color-text-muted)]">
            Cerca termini storici nel dizionario usando filtri avanzati
          </p>
        </div>
      </FadeIn>

      {/* Search Form */}
      <FadeIn direction="up" delay={200}>
        <form method="get" className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-6 mb-8">
          <div className="mb-6">
            <label htmlFor="search" className="block text-sm font-semibold text-[var(--color-text)] mb-2">
              Termine da cercare
            </label>
            <RicercaSearchInput defaultValue={query} sampleTerms={sampleTerms} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="tipo" className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                Lingua
              </label>
              <select
                id="tipo"
                name="tipo"
                defaultValue={tipo || ''}
                className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] transition-colors"
              >
                <option value="">Tutte</option>
                <option value="latino">Latino</option>
                <option value="volgare">Volgare</option>
              </select>
            </div>

            <div>
              <label htmlFor="lemmario" className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                Dizionario
              </label>
              <select
                id="lemmario"
                name="lemmario"
                defaultValue={lemmarioId || ''}
                className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] transition-colors"
              >
                <option value="">Tutti i dizionari</option>
                {lemmariData.docs.map((lem) => (
                  <option key={lem.id} value={lem.id}>
                    {lem.titolo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)] px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-semibold"
          >
            Cerca
          </button>
        </form>
      </FadeIn>

      {/* Results */}
      {query && lemmiData && (
        <FadeIn direction="up" delay={100}>
          <div>
            <div className="mb-4 text-[var(--color-text-muted)]">
              {lemmiData.totalDocs === 0 ? (
                <span>Nessun risultato trovato per &ldquo;{query}&rdquo;</span>
              ) : (
                <span>
                  Trovati <span className="font-semibold">{lemmiData.totalDocs}</span> risultati
                  per &ldquo;{query}&rdquo;
                </span>
              )}
            </div>

            {lemmiData.docs.length > 0 && (
              <>
                <div className="space-y-4 mb-8">
                  {lemmiData.docs.map((lemma: Lemma) => {
                    const lemmario = typeof lemma.lemmario === 'object'
                      ? lemma.lemmario as Lemmario
                      : null

                    return (
                      <Link
                        key={lemma.id}
                        href={lemmario ? `/${lemmario.slug}/lemmi/${lemma.slug}` : `/lemmi/${lemma.slug}`}
                        className="block bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-serif text-2xl font-bold text-[var(--color-text)]">
                            {lemma.termine}
                          </h3>
                          <span className="label-uppercase text-[var(--color-text-muted)] ml-4 mt-1 shrink-0">
                            {lemma.tipo === 'latino' ? 'Latino' : 'Volgare'}
                          </span>
                        </div>

                        {lemmario && (
                          <div className="text-sm text-[var(--color-text-muted)] mb-3">
                            {lemmario.titolo}
                          </div>
                        )}

                        {lemma.etimologia && (
                          <p className="text-[var(--color-text-body)] line-clamp-2">
                            {lemma.etimologia}
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>

                {/* Pagination */}
                {lemmiData.totalPages > 1 && (
                  <div className="flex justify-center gap-2">
                    {lemmiData.hasPrevPage && (
                      <Link
                        href={`/ricerca?q=${query}&page=${lemmiData.prevPage}${tipo ? `&tipo=${tipo}` : ''}${lemmarioId ? `&lemmario=${lemmarioId}` : ''}`}
                        className="px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-subtle)] transition-colors"
                      >
                        &larr; Precedente
                      </Link>
                    )}

                    <div className="px-4 py-2 bg-[var(--color-bg-subtle)] rounded-lg text-[var(--color-text-muted)]">
                      Pagina {lemmiData.page} di {lemmiData.totalPages}
                    </div>

                    {lemmiData.hasNextPage && (
                      <Link
                        href={`/ricerca?q=${query}&page=${lemmiData.nextPage}${tipo ? `&tipo=${tipo}` : ''}${lemmarioId ? `&lemmario=${lemmarioId}` : ''}`}
                        className="px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-subtle)] transition-colors"
                      >
                        Successiva &rarr;
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </FadeIn>
      )}

      {/* Tips */}
      {!query && (
        <FadeIn direction="up" delay={400}>
          <div className="bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-lg p-6">
            <h3 className="font-semibold text-[var(--color-text)] mb-3">Suggerimenti per la ricerca</h3>
            <ul className="space-y-2 text-sm text-[var(--color-text-body)]">
              <li>Inserisci almeno 3 caratteri per ottenere risultati migliori</li>
              <li>Puoi cercare termini in latino o volgare</li>
              <li>Usa i filtri per raffinare la ricerca per dizionario o lingua</li>
              <li>La ricerca include anche le varianti grafiche dei termini</li>
            </ul>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
