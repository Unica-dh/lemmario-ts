import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLemmarioBySlug, getLemmi } from '@/lib/payload-api'
import { SearchBar } from '@/components/search/SearchBar'
import { FilterBar } from '@/components/search/FilterBar'
import { Pagination } from '@/components/search/Pagination'
import { LemmiList } from '@/components/lemmi/LemmiList'
import type { Metadata } from 'next'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    'lemmario-slug': string
  }
  searchParams: {
    page?: string
    tipo?: 'latino' | 'volgare'
    q?: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])

  if (!lemmario) {
    return {
      title: 'Lemmario non trovato',
    }
  }

  return {
    title: `${lemmario.titolo} - Lemmi`,
    description: lemmario.descrizione || `Esplora i lemmi del ${lemmario.titolo}`,
  }
}

export default async function LemmarioPage({ params, searchParams }: PageProps) {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])

  if (!lemmario) {
    notFound()
  }

  const page = parseInt(searchParams.page || '1', 10)
  const tipo = searchParams.tipo
  const searchQuery = searchParams.q

  // Build query
  const where: Record<string, unknown> = {
    lemmario: { equals: lemmario.id },
  }

  if (tipo) {
    where.tipo = { equals: tipo }
  }

  if (searchQuery) {
    where.termine = { contains: searchQuery }
  }

  const itemsPerPage = 24

  // Fetch lemmi with filters
  const lemmiData = await getLemmi({
    limit: itemsPerPage,
    page,
    where,
    depth: 0,
    sort: 'termine',
  })

  // Fetch counts for filter badges (optional optimization: could be cached)
  const [allCount, latinoCount, volgareCount] = await Promise.all([
    getLemmi({
      limit: 1,
      where: { lemmario: { equals: lemmario.id } },
    }).then((res) => res.totalDocs),
    getLemmi({
      limit: 1,
      where: { lemmario: { equals: lemmario.id }, tipo: { equals: 'latino' } },
    }).then((res) => res.totalDocs),
    getLemmi({
      limit: 1,
      where: { lemmario: { equals: lemmario.id }, tipo: { equals: 'volgare' } },
    }).then((res) => res.totalDocs),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-primary-600">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-gray-900 font-medium">
            {lemmario.titolo}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{lemmario.titolo}</h1>
        {lemmario.descrizione && (
          <p className="text-xl text-gray-600 mb-4">{lemmario.descrizione}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {lemmario.periodo_storico && (
            <div>
              <span className="font-semibold">Periodo storico:</span>{' '}
              {lemmario.periodo_storico}
            </div>
          )}
          {lemmario.data_pubblicazione && (
            <div>
              <span className="font-semibold">Pubblicato:</span>{' '}
              {new Date(lemmario.data_pubblicazione).toLocaleDateString('it-IT')}
            </div>
          )}
          <div>
            <span className="font-semibold">Lemmi totali:</span> {allCount}
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <SearchBar placeholder="Cerca un lemma per termine..." />
        
        <FilterBar
          showCount
          counts={{
            tutti: allCount,
            latino: latinoCount,
            volgare: volgareCount,
          }}
        />
      </div>

      {/* Results info */}
      {searchQuery && (
        <div className="mb-4 text-sm text-gray-600">
          {lemmiData.totalDocs > 0 ? (
            <>
              Trovati <span className="font-semibold">{lemmiData.totalDocs}</span> risultati
              per &ldquo;<span className="font-semibold">{searchQuery}</span>&rdquo;
            </>
          ) : (
            <>
              Nessun risultato per &ldquo;
              <span className="font-semibold">{searchQuery}</span>&rdquo;
            </>
          )}
        </div>
      )}

      {/* Lemmi List */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <LemmiList lemmi={lemmiData.docs} lemmarioSlug={lemmario.slug} />
      </div>

      {/* Pagination */}
      {lemmiData.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={lemmiData.totalPages}
          totalItems={lemmiData.totalDocs}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  )
}
