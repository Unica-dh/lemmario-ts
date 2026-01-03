import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLemmarioBySlug, getLemmi } from '@/lib/payload-api'
import type { Lemma } from '@/types/payload'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    slug: string
  }
  searchParams: {
    page?: string
    tipo?: 'latino' | 'volgare'
  }
}

export default async function LemmarioPage({ params, searchParams }: PageProps) {
  const lemmario = await getLemmarioBySlug(params.slug)

  if (!lemmario) {
    notFound()
  }

  const page = parseInt(searchParams.page || '1')
  const tipo = searchParams.tipo

  // Build query
  const where: Record<string, unknown> = {
    lemmario: { equals: lemmario.id },
  }
  if (tipo) {
    where.tipo = { equals: tipo }
  }

  const lemmiData = await getLemmi({
    limit: 24,
    page,
    where,
    depth: 0,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link href="/" className="hover:text-primary-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/" className="hover:text-primary-600">Dizionari</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{lemmario.titolo}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {lemmario.titolo}
        </h1>
        {lemmario.descrizione && (
          <p className="text-xl text-gray-600 mb-4">
            {lemmario.descrizione}
          </p>
        )}
        <div className="flex gap-4 text-sm text-gray-600">
          {lemmario.periodo_storico && (
            <div>
              <span className="font-semibold">Periodo storico:</span> {lemmario.periodo_storico}
            </div>
          )}
          {lemmario.data_pubblicazione && (
            <div>
              <span className="font-semibold">Pubblicato:</span>{' '}
              {new Date(lemmario.data_pubblicazione).toLocaleDateString('it-IT')}
            </div>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex gap-2">
          <Link
            href={`/lemmari/${lemmario.slug}`}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !tipo
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tutti
          </Link>
          <Link
            href={`/lemmari/${lemmario.slug}?tipo=latino`}
            className={`px-4 py-2 rounded-lg transition-colors ${
              tipo === 'latino'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Latino
          </Link>
          <Link
            href={`/lemmari/${lemmario.slug}?tipo=volgare`}
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

      {/* Results Count */}
      <div className="mb-4 text-gray-600">
        <span className="font-semibold">{lemmiData.totalDocs}</span> lemmi
        {tipo && ` in ${tipo}`}
      </div>

      {/* Lemmi Grid */}
      {lemmiData.docs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Nessun lemma disponibile.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {lemmiData.docs.map((lemma: Lemma) => (
              <Link
                key={lemma.id}
                href={`/lemmi/${lemma.slug}`}
                className="block bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-primary-300 transition-all"
              >
                <div className="font-semibold text-gray-900 mb-1">
                  {lemma.termine}
                </div>
                <div className={`text-xs ${
                  lemma.tipo === 'latino'
                    ? 'text-blue-600'
                    : 'text-green-600'
                }`}>
                  {lemma.tipo === 'latino' ? 'Latino' : 'Volgare'}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {lemmiData.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {lemmiData.hasPrevPage && (
                <Link
                  href={`/lemmari/${lemmario.slug}?page=${lemmiData.prevPage}${tipo ? `&tipo=${tipo}` : ''}`}
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
                  href={`/lemmari/${lemmario.slug}?page=${lemmiData.nextPage}${tipo ? `&tipo=${tipo}` : ''}`}
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
