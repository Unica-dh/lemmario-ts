import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getLemmarioBySlug,
  getLemmaBySlug,
  getDefinizioniByLemma,
  getVariantiByLemma,
  getRiferimentiByLemma,
  getRicorrenzeByDefinizioniIds,
} from '@/lib/payload-api'
import type { LemmaDettagliato, Definizione, LivelloRazionalita, Ricorrenza, Fonte } from '@/types/payload'
import { Badge } from '@/components/ui/Badge'
import { DefinizioneCard } from '@/components/lemma/DefinizioneCard'
import { VariantiGrafiche } from '@/components/lemma/VariantiGrafiche'
import { RiferimentiIncrociati } from '@/components/lemma/RiferimentiIncrociati'
import { LemmaSchema, BreadcrumbSchema } from '@/components/seo'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glossari.dh.unica.it'

interface PageProps {
  params: {
    'lemmario-slug': string
    termine: string
  }
  searchParams: {
    q?: string
    tipo?: string
    page?: string
  }
}

/**
 * Generate metadata for lemma page
 * This enables rich previews in search engines and social media
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lemmarioSlug = params['lemmario-slug']
  const termine = params.termine

  // Fetch data for metadata
  const lemmario = await getLemmarioBySlug(lemmarioSlug)
  if (!lemmario) {
    return { title: 'Lemmario non trovato' }
  }

  const lemma = await getLemmaBySlug(termine, lemmario.id)
  if (!lemma) {
    return { title: 'Lemma non trovato' }
  }

  // Get definitions for description
  const definizioni = await getDefinizioniByLemma(lemma.id)

  // Build description from first definition or etymology
  let description = ''
  if (definizioni.length > 0 && definizioni[0].testo) {
    // Strip HTML tags if present
    const testoPlain = definizioni[0].testo.replace(/<[^>]*>/g, '')
    description = testoPlain.length > 155
      ? testoPlain.substring(0, 152) + '...'
      : testoPlain
  } else if (lemma.etimologia) {
    description = lemma.etimologia.length > 155
      ? lemma.etimologia.substring(0, 152) + '...'
      : lemma.etimologia
  } else {
    description = `Definizione del termine "${lemma.termine}" nel ${lemmario.titolo}`
  }

  const title = `${lemma.termine} - ${lemmario.titolo}`
  const url = `${SITE_URL}/${lemmarioSlug}/lemmi/${termine}`

  // Keywords
  const keywords = [
    lemma.termine,
    lemmario.titolo,
    'glossario storico',
    'lessico italiano',
    'terminologia',
  ]
  if (lemma.tipo === 'latino') {
    keywords.push('latino', 'lessico latino')
  } else {
    keywords.push('volgare', 'italiano antico')
  }

  return {
    title,
    description,
    keywords,
    authors: [{ name: 'Centro Umanistica Digitale - UniCa' }],

    alternates: {
      canonical: url,
    },

    openGraph: {
      title,
      description,
      url,
      siteName: 'Glossari - Universita di Cagliari',
      type: 'article',
      locale: 'it_IT',
      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${lemma.termine} - ${lemmario.titolo}`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og-image.jpg`],
    },

    other: {
      'citation_title': lemma.termine,
      'citation_publisher': 'Universita degli Studi di Cagliari',
    },
  }
}

export default async function LemmaPage({ params, searchParams }: PageProps) {
  // Verifica il lemmario esista
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])
  if (!lemmario) {
    notFound()
  }

  // Ricerca il lemma per slug (termine)
  const lemmaData = await getLemmaBySlug(params.termine, lemmario.id)
  if (!lemmaData) {
    notFound()
  }

  // Carica le relazioni separatamente (non vengono populate con depth=2 perché sono inverse)
  const [definizioni, varianti, riferimenti] = await Promise.all([
    getDefinizioniByLemma(lemmaData.id),
    getVariantiByLemma(lemmaData.id),
    getRiferimentiByLemma(lemmaData.id),
  ])

  // Carica le ricorrenze per tutte le definizioni
  const definizioneIds = definizioni.map(d => d.id)
  const ricorrenzeMap = await getRicorrenzeByDefinizioniIds(definizioneIds)

  // Associa le ricorrenze alle definizioni
  type DefinizioneConRicorrenze = Definizione & {
    livello_razionalita?: LivelloRazionalita
    ricorrenze?: Array<Ricorrenza & { fonte?: Fonte }>
  }
  const definizioniConRicorrenze: DefinizioneConRicorrenze[] = definizioni.map(def => ({
    ...def,
    livello_razionalita: typeof def.livello_razionalita === 'object' ? def.livello_razionalita : undefined,
    ricorrenze: (ricorrenzeMap.get(def.id) || []) as Array<Ricorrenza & { fonte?: Fonte }>,
  }))

  // Costruisci lemma dettagliato con tutte le relazioni
  const lemma: LemmaDettagliato = {
    ...lemmaData,
    definizioni: definizioniConRicorrenze,
    varianti,
    riferimenti_in_uscita: riferimenti as LemmaDettagliato['riferimenti_in_uscita'],
  }

  // Costruisci URL di ritorno con parametri di ricerca
  const backParams = new URLSearchParams()
  if (searchParams.q) backParams.set('q', searchParams.q)
  if (searchParams.tipo) backParams.set('tipo', searchParams.tipo)
  if (searchParams.page) backParams.set('page', searchParams.page)
  const backUrl = `/${lemmario.slug}${backParams.toString() ? `?${backParams}` : ''}`

  // Prepare description for JSON-LD from first definition
  const primaDefinizione = definizioniConRicorrenze[0]?.testo
    ? definizioniConRicorrenze[0].testo.replace(/<[^>]*>/g, '')
    : undefined

  // Breadcrumb items for JSON-LD
  const breadcrumbItems = [
    { name: 'Home', url: SITE_URL },
    { name: lemmario.titolo, url: `${SITE_URL}/${lemmario.slug}` },
    { name: lemma.termine, url: `${SITE_URL}/${lemmario.slug}/lemmi/${lemma.slug}` },
  ]

  return (
    <>
      {/* JSON-LD Structured Data */}
      <LemmaSchema
        lemma={{
          termine: lemma.termine,
          slug: lemma.slug,
          tipo: lemma.tipo,
          etimologia: lemma.etimologia,
        }}
        lemmario={{
          slug: lemmario.slug,
          titolo: lemmario.titolo,
        }}
        definizione={primaDefinizione}
      />
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="hover:text-primary-600 transition-colors">
              Home
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href={backUrl} className="hover:text-primary-600 transition-colors">
              {lemmario.titolo}
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-semibold">{lemma.termine}</li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 flex items-baseline flex-wrap gap-y-2">
              <span>{lemma.termine}</span>
              {lemma.riferimenti_in_uscita && lemma.riferimenti_in_uscita.length > 0 && (
                <RiferimentiIncrociati
                  riferimenti={lemma.riferimenti_in_uscita}
                  lemmarioSlug={lemmario.slug}
                />
              )}
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant="default" size="lg">
                {lemma.tipo === 'latino' ? 'Latine' : 'Volgare'}
              </Badge>
              {lemma.status === 'published' && (
                <Badge variant="muted" size="sm">
                  Pubblicato
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenuto principale */}
      <main>
        {/* Etimologia */}
        {lemma.etimologia && (
          <section className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Etimologia
            </h2>
            <p className="text-gray-700 leading-relaxed">{lemma.etimologia}</p>
          </section>
        )}

        {/* Varianti Grafiche */}
        {lemma.varianti && lemma.varianti.length > 0 && (
          <VariantiGrafiche varianti={lemma.varianti} />
        )}

        {/* Definizioni */}
        {lemma.definizioni && lemma.definizioni.length > 0 ? (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Definizioni ({lemma.definizioni.length})
            </h2>
            <div className="space-y-6">
              {lemma.definizioni
                .sort((a, b) => a.numero - b.numero)
                .map((def) => (
                  <DefinizioneCard key={def.id} definizione={def} numero={def.numero} />
                ))}
            </div>
          </section>
        ) : (
          <section className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600 text-center italic">
              Nessuna definizione disponibile per questo lemma.
            </p>
          </section>
        )}

        {/* Note Redazionali */}
        {lemma.note_redazionali && (
          <section className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Note Redazionali
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">{lemma.note_redazionali}</p>
          </section>
        )}
      </main>

      {/* Footer Navigation */}
      <nav className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Torna ai lemmi
        </Link>
      </nav>
      </div>
    </>
  )
}
