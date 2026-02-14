import { notFound } from 'next/navigation'
import { getLemmarioBySlug, getLemmi, getDefinizioniByLemma, getRicorrenzeByDefinizioniIds } from '@/lib/payload-api'
import { SearchBar } from '@/components/search/SearchBar'
import { Pagination } from '@/components/search/Pagination'
import { LemmaCard } from '@/components/lemmi/LemmaCard'
import { AlphabetSidebar } from '@/components/ui/AlphabetSidebar'
import { AlphabetDrawer } from '@/components/ui/AlphabetDrawer'
import type { Metadata } from 'next'
import type { Definizione } from '@/types/payload'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 16

interface PageProps {
  params: {
    'lemmario-slug': string
  }
  searchParams: {
    page?: string
    lettera?: string
    q?: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])

  if (!lemmario) {
    return { title: 'Lemmario non trovato' }
  }

  return {
    title: `${lemmario.titolo} - Glossario`,
    description: lemmario.descrizione || `Esplora i lemmi del ${lemmario.titolo}`,
  }
}

export default async function LemmarioPage({ params, searchParams }: PageProps) {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])

  if (!lemmario) {
    notFound()
  }

  const page = parseInt(searchParams.page || '1', 10)
  const letteraAttiva = searchParams.lettera
  const searchQuery = searchParams.q

  // Fetch ALL lemmi for this lemmario (client-side filtering due to Payload API limitations)
  const allLemmiData = await getLemmi({
    limit: 500,
    page: 1,
    where: { lemmario: { equals: lemmario.id } },
    depth: 0,
  })

  // Sort A-Z
  const allLemmi = [...allLemmiData.docs].sort((a, b) =>
    a.termine.localeCompare(b.termine, 'it')
  )

  // Calculate available letters
  const lettereDisponibili = [...new Set(
    allLemmi.map((l) => l.termine[0].toUpperCase())
  )].sort()

  // For search in definitions, fetch definitions for all lemmi
  // Only when user is actually searching (to avoid unnecessary API calls)
  let definizioniMap: Map<number, Definizione[]> = new Map()
  if (searchQuery) {
    const defPromises = allLemmi.map(async (lemma) => {
      const defs = await getDefinizioniByLemma(lemma.id)
      return { lemmaId: lemma.id, defs }
    })
    const defResults = await Promise.all(defPromises)
    definizioniMap = new Map(defResults.map((r) => [r.lemmaId, r.defs]))
  }

  // Apply filters
  let filteredLemmi = allLemmi

  // Letter filter
  if (letteraAttiva && !searchQuery) {
    filteredLemmi = filteredLemmi.filter(
      (lemma) => lemma.termine[0].toUpperCase() === letteraAttiva
    )
  }

  // Search filter (searches in termine + definition text)
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase()
    filteredLemmi = filteredLemmi.filter((lemma) => {
      if (lemma.termine.toLowerCase().includes(lowerQuery)) return true
      const defs = definizioniMap.get(lemma.id) || []
      return defs.some((d) => d.testo?.toLowerCase().includes(lowerQuery))
    })
  }

  // Pagination
  const totalFiltered = filteredLemmi.length
  const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const paginatedLemmi = filteredLemmi.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Fetch definition previews for paginated lemmi (for card display)
  const previewPromises = paginatedLemmi.map(async (lemma) => {
    // Re-use definitions from search if available
    if (definizioniMap.has(lemma.id)) {
      const defs = definizioniMap.get(lemma.id) || []
      return {
        lemmaId: lemma.id,
        preview: defs[0]?.testo || '',
        defCount: defs.length,
        defIds: defs.map(d => d.id),
      }
    }
    const defs = await getDefinizioniByLemma(lemma.id)
    return {
      lemmaId: lemma.id,
      preview: defs[0]?.testo || '',
      defCount: defs.length,
      defIds: defs.map(d => d.id),
    }
  })
  const previews = await Promise.all(previewPromises)
  const previewMap = new Map(previews.map((p) => [p.lemmaId, p]))

  // Fetch ricorrenze to count distinct fonti per lemma
  const allDefIds = previews.flatMap(p => p.defIds)
  const ricorrenzeMap = allDefIds.length > 0
    ? await getRicorrenzeByDefinizioniIds(allDefIds)
    : new Map()

  const fontiCountMap = new Map<number, number>()
  for (const preview of previews) {
    const fontiSet = new Set<number>()
    for (const defId of preview.defIds) {
      const ricorrenze = ricorrenzeMap.get(defId) || []
      for (const r of ricorrenze) {
        const fonteId = typeof r.fonte === 'number' ? r.fonte : r.fonte?.id
        if (fonteId) fontiSet.add(fonteId)
      }
    }
    fontiCountMap.set(preview.lemmaId, fontiSet.size)
  }

  // Subtitle text
  const subtitleParts: string[] = []
  if (letteraAttiva && !searchQuery) {
    subtitleParts.push(`Sezione: ${letteraAttiva}`)
  }
  subtitleParts.push(`${totalFiltered} lemmi catalogati`)
  const subtitle = subtitleParts.join(' \u2014 ')

  return (
    <div className="relative">
      {/* Alphabet sidebar (desktop) */}
      <AlphabetSidebar
        lettereDisponibili={lettereDisponibili}
        letteraAttiva={letteraAttiva}
      />

      {/* Alphabet drawer (mobile) */}
      <AlphabetDrawer
        lettereDisponibili={lettereDisponibili}
        letteraAttiva={letteraAttiva}
      />

      {/* Main content */}
      <div className="container mx-auto px-4 md:px-20 py-8 md:py-12">
        {/* Hero */}
        <header className="mb-6 md:mb-8 text-center">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[var(--color-text)] mb-3">
            {lemmario.titolo}
          </h1>
          <p className="label-uppercase text-[var(--color-text-muted)]">
            {subtitle}
          </p>
          <div className="mt-6 border-t border-[var(--color-border)]" />
        </header>

        {/* Search */}
        <div className="mb-8 md:mb-12">
          <SearchBar />
        </div>

        {/* Search results info */}
        {searchQuery && (
          <div className="text-center mb-8 text-sm text-[var(--color-text-muted)]">
            {totalFiltered > 0 ? (
              <>
                Trovati <span className="font-semibold">{totalFiltered}</span> risultati
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

        {/* Lemma grid */}
        {paginatedLemmi.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-12 gap-y-0 divide-y divide-[var(--color-border)] md:divide-y-0">
            {paginatedLemmi.map((lemma) => {
              const preview = previewMap.get(lemma.id)
              return (
                <div
                  key={lemma.id}
                  className="border-b border-[var(--color-border)] md:border-b-0 md:border-b md:border-[var(--color-border)]"
                >
                  <LemmaCard
                    termine={lemma.termine}
                    slug={lemma.slug}
                    tipo={lemma.tipo}
                    lemmarioSlug={lemmario.slug}
                    definitionPreview={preview?.preview}
                    defCount={preview?.defCount || 0}
                    fontiCount={fontiCountMap.get(lemma.id) || 0}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState searchQuery={searchQuery} letteraAttiva={letteraAttiva} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
          />
        )}
      </div>
    </div>
  )
}

function EmptyState({ searchQuery, letteraAttiva }: { searchQuery?: string; letteraAttiva?: string }) {
  return (
    <div className="text-center py-16" data-testid="empty-state">
      <svg
        className="mx-auto h-12 w-12 text-[var(--color-text-disabled)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
      <h3 className="mt-4 font-serif text-lg text-[var(--color-text)]">Nessun lemma trovato</h3>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        {searchQuery
          ? 'Prova a modificare la ricerca.'
          : letteraAttiva
            ? `Nessun lemma inizia per "${letteraAttiva}".`
            : 'Prova a modificare i filtri.'}
      </p>
    </div>
  )
}
