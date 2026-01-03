import Link from 'next/link'
import { getLemmi } from '@/lib/payload-api'
import type { Lemma, Lemmario } from '@/types/payload'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: {
    page?: string
    tipo?: 'latino' | 'volgare'
    search?: string
  }
}

export default async function LemmiPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || '1')
  const tipo = searchParams.tipo
  const search = searchParams.search

  // Build query
  const where: Record<string, unknown> = {}
  if (tipo) {
    where.tipo = { equals: tipo }
  }
  if (search) {
    where.termine = { contains: search }
  }

  const lemmiData = await getLemmi({
    limit: 20,
    page,
    where: Object.keys(where).length > 0 ? where : undefined,
    depth: 1,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Indice dei Lemmi</h1>
        <p className="text-gray-600">
          Esplora tutti i termini del dizionario storico
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            <Link
              href="/lemmi"
              className={`px-4 py-2 rounded-lg transition-colors ${
                !tipo
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutti
            </Link>
            <Link
              href="/lemmi?tipo=latino"
              className={`px-4 py-2 rounded-lg transition-colors ${
                tipo === 'latino'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Latino
            </Link>
            <Link
              href="/lemmi?tipo=volgare"
              className={`px-4 py-2 rounded-lg transition-colors ${
                tipo === 'volgare'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Volgare
            </Link>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-gray-600">
        Trovati <span className="font-semibold">{lemmiData.totalDocs}</span> lemmi
        {tipo && ` in ${tipo}`}
      </div>

      {/* Lemmi List */}
      {lemmiData.docs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Nessun lemma trovato.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {lemmiData.docs.map((lemma: Lemma) => {
              const lemmario = typeof lemma.lemmario === 'object'
                ? lemma.lemmario as Lemmario
                : null

              return (
                <Link
                  key={lemma.id}
                  href={`/lemmi/${lemma.slug}`}
                  className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {lemma.termine}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      lemma.tipo === 'latino'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {lemma.tipo === 'latino' ? 'LAT' : 'VOL'}
                    </span>
                  </div>
                  {lemmario && (
                    <p className="text-sm text-gray-600">
                      {lemmario.titolo}
                    </p>
                  )}
                  {lemma.etimologia && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
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
                  href={`/lemmi?page=${lemmiData.prevPage}${tipo ? `&tipo=${tipo}` : ''}`}
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
                  href={`/lemmi?page=${lemmiData.nextPage}${tipo ? `&tipo=${tipo}` : ''}`}
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
  )
}
