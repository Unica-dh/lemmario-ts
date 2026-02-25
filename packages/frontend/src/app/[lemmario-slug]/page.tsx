import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getLemmarioBySlug, getLemmi, getAllDefinizioniGrouped, getRicorrenzeByDefinizioniIds, getCrossReferenceMap } from '@/lib/payload-api'
import { LemmarioScrollView } from '@/components/lemmi/LemmarioScrollView'
import { AnimatedCount } from '@/components/animations/AnimatedCount'
import { getMediaUrl } from '@/lib/media-url'
import type { Metadata } from 'next'
import type { LetterGroup } from '@/components/lemmi/LetterSection'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    'lemmario-slug': string
  }
  searchParams: {
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

export default async function LemmarioPage({ params }: PageProps) {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])

  if (!lemmario) {
    notFound()
  }

  // Fetch ALL lemmi for this lemmario
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

  // Pick random sample terms for typewriter placeholder
  const shuffled = [...allLemmi].sort(() => Math.random() - 0.5)
  const sampleTerms = shuffled.slice(0, 6).map((l) => l.termine)

  // Bulk fetch all definitions (single API call)
  const definizioniMap = await getAllDefinizioniGrouped()

  // Collect all definition IDs for ricorrenze batch fetch
  const allDefIds: number[] = []
  for (const lemma of allLemmi) {
    const defs = definizioniMap.get(lemma.id) || []
    for (const def of defs) {
      allDefIds.push(def.id)
    }
  }

  // Fetch ricorrenze and cross-references in parallel
  const [ricorrenzeMap, crossRefMap] = await Promise.all([
    allDefIds.length > 0 ? getRicorrenzeByDefinizioniIds(allDefIds) : Promise.resolve(new Map()),
    getCrossReferenceMap(),
  ])

  // Compute fonti counts per lemma
  const fontiCountMap = new Map<number, number>()
  for (const lemma of allLemmi) {
    const defs = definizioniMap.get(lemma.id) || []
    const fontiSet = new Set<number>()
    for (const def of defs) {
      const ricorrenze = ricorrenzeMap.get(def.id) || []
      for (const r of ricorrenze) {
        const fonteId = typeof r.fonte === 'number' ? r.fonte : r.fonte?.id
        if (fonteId) fontiSet.add(fonteId)
      }
    }
    fontiCountMap.set(lemma.id, fontiSet.size)
  }

  // Build letter groups
  const letterGroups: LetterGroup[] = lettereDisponibili.map((letter) => ({
    letter,
    lemmi: allLemmi
      .filter((l) => l.termine[0].toUpperCase() === letter)
      .map((lemma) => {
        const defs = definizioniMap.get(lemma.id) || []
        return {
          id: lemma.id,
          termine: lemma.termine,
          slug: lemma.slug,
          tipo: lemma.tipo,
          preview: defs[0]?.testo || '',
          defCount: defs.length,
          fontiCount: fontiCountMap.get(lemma.id) || 0,
          cfrCount: (crossRefMap.get(lemma.id) || []).length,
        }
      }),
  }))

  const logoObj = typeof lemmario.logo === 'object' ? lemmario.logo : null
  const logoUrl = logoObj ? getMediaUrl(logoObj.url) : null
  const isSvg = logoObj?.mimeType === 'image/svg+xml'

  return (
    <div className="relative">
      {/* Hero */}
      <div className="container mx-auto px-4 md:px-20 py-8 md:py-12">
        <header className={`mb-6 md:mb-8 ${logoUrl ? 'flex flex-col md:flex-row items-center md:items-center gap-4 md:gap-8' : 'text-center'}`}>
          {logoObj && logoUrl && (
            <div className="shrink-0 w-[80px] h-[80px] md:w-[120px] md:h-[120px] relative">
              {isSvg ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt={logoObj.alt || `Logo ${lemmario.titolo}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={logoUrl}
                  alt={logoObj.alt || `Logo ${lemmario.titolo}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 80px, 120px"
                />
              )}
            </div>
          )}
          <div className={logoUrl ? 'text-center md:text-left' : ''}>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-[var(--color-text)] mb-3">
              {lemmario.titolo}
            </h1>
            <p className="label-uppercase text-[var(--color-text-muted)]">
              <AnimatedCount value={allLemmi.length} suffix="lemmi catalogati" />
            </p>
          </div>
        </header>
      </div>

      {/* Scrollable content */}
      <LemmarioScrollView
        letterGroups={letterGroups}
        lettereDisponibili={lettereDisponibili}
        lemmarioSlug={lemmario.slug}
        sampleTerms={sampleTerms}
        totalCount={allLemmi.length}
      />
    </div>
  )
}
