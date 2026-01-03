import Link from 'next/link'
import { getLemmi, getLemmari } from '@/lib/payload-api'
import type { Lemma, Lemmario } from '@/types/payload'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Ricerca Avanzata</h1>
        <p className="text-gray-600">
          Cerca termini storici nel dizionario usando filtri avanzati
        </p>
      </div>

      {/* Search Form */}
      <form method="get" className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="mb-6">
          <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
            Termine da cercare
          </label>
          <input
            type="text"
            id="search"
            name="q"
            defaultValue={query}
            placeholder="Es: additio, camera, libro..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="tipo" className="block text-sm font-semibold text-gray-700 mb-2">
              Lingua
            </label>
            <select
              id="tipo"
              name="tipo"
              defaultValue={tipo || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tutte</option>
              <option value="latino">Latino</option>
              <option value="volgare">Volgare</option>
            </select>
          </div>

          <div>
            <label htmlFor="lemmario" className="block text-sm font-semibold text-gray-700 mb-2">
              Dizionario
            </label>
            <select
              id="lemmario"
              name="lemmario"
              defaultValue={lemmarioId || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
        >
          Cerca
        </button>
      </form>

      {/* Results */}
      {query && lemmiData && (
        <div>
          <div className="mb-4 text-gray-600">
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
                      href={`/lemmi/${lemma.slug}`}
                      className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {lemma.termine}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          lemma.tipo === 'latino'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {lemma.tipo === 'latino' ? 'Latino' : 'Volgare'}
                        </span>
                      </div>

                      {lemmario && (
                        <div className="text-sm text-gray-600 mb-3">
                          {lemmario.titolo}
                          {lemmario.periodo_storico && ` • ${lemmario.periodo_storico}`}
                        </div>
                      )}

                      {lemma.etimologia && (
                        <p className="text-gray-700 line-clamp-2">
                          {lemma.etimologia}
                        </p>
                      )}

                      <div className="mt-4 text-primary-600 font-medium">
                        Visualizza dettagli →
                      </div>
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
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      ← Precedente
                    </Link>
                  )}

                  <div className="px-4 py-2 bg-gray-100 rounded-lg">
                    Pagina {lemmiData.page} di {lemmiData.totalPages}
                  </div>

                  {lemmiData.hasNextPage && (
                    <Link
                      href={`/ricerca?q=${query}&page=${lemmiData.nextPage}${tipo ? `&tipo=${tipo}` : ''}${lemmarioId ? `&lemmario=${lemmarioId}` : ''}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Successiva →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tips */}
      {!query && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Suggerimenti per la ricerca</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Inserisci almeno 3 caratteri per ottenere risultati migliori</li>
            <li>• Puoi cercare termini in latino o volgare</li>
            <li>• Usa i filtri per raffinare la ricerca per dizionario o lingua</li>
            <li>• La ricerca include anche le varianti grafiche dei termini</li>
          </ul>
        </div>
      )}
    </div>
  )
}
