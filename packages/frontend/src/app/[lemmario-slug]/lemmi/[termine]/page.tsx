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
    lettera?: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lemmarioSlug = params['lemmario-slug']
  const termine = params.termine

  const lemmario = await getLemmarioBySlug(lemmarioSlug)
  if (!lemmario) {
    return { title: 'Lemmario non trovato' }
  }

  const lemma = await getLemmaBySlug(termine, lemmario.id)
  if (!lemma) {
    return { title: 'Lemma non trovato' }
  }

  const definizioni = await getDefinizioniByLemma(lemma.id)

  let description = ''
  if (definizioni.length > 0 && definizioni[0].testo) {
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
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Glossari - Universita di Cagliari',
      type: 'article',
      locale: 'it_IT',
      images: [{
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${lemma.termine} - ${lemmario.titolo}`,
      }],
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
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])
  if (!lemmario) {
    notFound()
  }

  const lemmaData = await getLemmaBySlug(params.termine, lemmario.id)
  if (!lemmaData) {
    notFound()
  }

  const [definizioni, varianti, riferimenti] = await Promise.all([
    getDefinizioniByLemma(lemmaData.id),
    getVariantiByLemma(lemmaData.id),
    getRiferimentiByLemma(lemmaData.id),
  ])

  const definizioneIds = definizioni.map(d => d.id)
  const ricorrenzeMap = await getRicorrenzeByDefinizioniIds(definizioneIds)

  type DefinizioneConRicorrenze = Definizione & {
    livello_razionalita?: LivelloRazionalita
    ricorrenze?: Array<Ricorrenza & { fonte?: Fonte }>
  }
  const definizioniConRicorrenze: DefinizioneConRicorrenze[] = definizioni.map(def => ({
    ...def,
    livello_razionalita: typeof def.livello_razionalita === 'object' ? def.livello_razionalita : undefined,
    ricorrenze: (ricorrenzeMap.get(def.id) || []) as Array<Ricorrenza & { fonte?: Fonte }>,
  }))

  const lemma: LemmaDettagliato = {
    ...lemmaData,
    definizioni: definizioniConRicorrenze,
    varianti,
    riferimenti_in_uscita: riferimenti as LemmaDettagliato['riferimenti_in_uscita'],
  }

  // URL di ritorno al glossario con parametri preservati
  const backParams = new URLSearchParams()
  if (searchParams.q) backParams.set('q', searchParams.q)
  if (searchParams.lettera) backParams.set('lettera', searchParams.lettera)
  if (searchParams.page) backParams.set('page', searchParams.page)
  const backUrl = `/${lemmario.slug}${backParams.toString() ? `?${backParams}` : ''}`

  const primaDefinizione = definizioniConRicorrenze[0]?.testo
    ? definizioniConRicorrenze[0].testo.replace(/<[^>]*>/g, '')
    : undefined

  const breadcrumbItems = [
    { name: 'Home', url: SITE_URL },
    { name: lemmario.titolo, url: `${SITE_URL}/${lemmario.slug}` },
    { name: lemma.termine, url: `${SITE_URL}/${lemmario.slug}/lemmi/${lemma.slug}` },
  ]

  return (
    <>
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

      <article className="container mx-auto px-4 md:px-20 py-8 md:py-12 max-w-3xl">
        {/* Link torna al glossario */}
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 min-h-[44px] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-6 md:mb-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Torna al glossario
        </Link>

        {/* Header: Termine + Badge tipo */}
        <header className="mb-6 md:mb-8 pb-6 md:pb-8 border-b border-[var(--color-border)]">
          <div className="flex items-start justify-between">
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-[var(--color-text)]">
              {lemma.termine}
            </h1>
            <span className="label-uppercase text-[var(--color-text-muted)] mt-2 ml-4 shrink-0">
              {lemma.tipo === 'latino' ? 'Latino' : 'Volgare'}
            </span>
          </div>
        </header>

        {/* Varianti Grafiche */}
        {lemma.varianti && lemma.varianti.length > 0 && (
          <VariantiGrafiche varianti={lemma.varianti} />
        )}

        {/* Definizioni */}
        {lemma.definizioni && lemma.definizioni.length > 0 ? (
          <section className="mb-8">
            <div className="space-y-0 divide-y divide-[var(--color-border)]">
              {lemma.definizioni
                .sort((a, b) => a.numero - b.numero)
                .map((def) => (
                  <div key={def.id} className="py-8 first:pt-0">
                    <DefinizioneCard definizione={def} numero={def.numero} />
                  </div>
                ))}
            </div>
          </section>
        ) : (
          <section className="mb-8 py-12 text-center">
            <p className="font-serif italic text-[var(--color-text-muted)]">
              Nessuna definizione disponibile per questo lemma.
            </p>
          </section>
        )}

        {/* Riferimenti Incrociati */}
        {lemma.riferimenti_in_uscita && lemma.riferimenti_in_uscita.length > 0 && (
          <div className="pt-8 border-t border-[var(--color-border)]">
            <RiferimentiIncrociati
              riferimenti={lemma.riferimenti_in_uscita}
              lemmarioSlug={lemmario.slug}
            />
          </div>
        )}
      </article>
    </>
  )
}
