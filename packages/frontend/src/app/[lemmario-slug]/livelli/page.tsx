import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getLemmarioBySlug,
  getLivelliRazionalita,
} from '@/lib/payload-api'
import type { PaginatedResponse, Definizione, Lemma, LivelloRazionalita } from '@/types/payload'

export const dynamic = 'force-dynamic'

const API_URL = typeof window === 'undefined'
  ? (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api')

interface PageProps {
  params: {
    'lemmario-slug': string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])
  if (!lemmario) {
    return { title: 'Lemmario non trovato' }
  }

  return {
    title: `Livelli di razionalit\u00e0 - ${lemmario.titolo}`,
    description: `Classificazione dei lemmi per livello di razionalit\u00e0 nel ${lemmario.titolo}`,
  }
}

interface LemmaRef {
  id: number
  slug: string
  termine: string
  tipo: string
}

export default async function LivelliPage({ params }: PageProps) {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])

  if (!lemmario) {
    notFound()
  }

  // Fetch livelli di razionalità for this lemmario
  const livelli = await getLivelliRazionalita(lemmario.id)

  // Fetch all definizioni with depth=2 to get livello and lemma populated
  let lemmiPerLivello = new Map<number, LemmaRef[]>()
  try {
    const response = await fetch(`${API_URL}/definizioni?limit=2000&depth=2`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: process.env.NODE_ENV === 'production' ? 60 : 0 },
    })
    if (response.ok) {
      const data: PaginatedResponse<Definizione> = await response.json()
      for (const def of data.docs) {
        const livello = typeof def.livello_razionalita === 'object'
          ? def.livello_razionalita as LivelloRazionalita
          : null
        const lemma = typeof def.lemma === 'object' ? def.lemma as Lemma : null

        if (!livello || !lemma) continue

        const existing = lemmiPerLivello.get(livello.id) || []
        if (!existing.some(l => l.id === lemma.id)) {
          existing.push({
            id: lemma.id,
            slug: lemma.slug,
            termine: lemma.termine,
            tipo: lemma.tipo,
          })
        }
        lemmiPerLivello.set(livello.id, existing)
      }
    }
  } catch {
    lemmiPerLivello = new Map()
  }

  // Sort lemmi alphabetically per livello
  for (const [livelloId, lemmi] of lemmiPerLivello) {
    lemmiPerLivello.set(livelloId, lemmi.sort((a, b) => a.termine.localeCompare(b.termine, 'it')))
  }

  // Sort livelli by numero/ordine
  const sortedLivelli = [...livelli].sort((a, b) =>
    (a.numero ?? a.ordine ?? 0) - (b.numero ?? b.ordine ?? 0)
  )

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Link torna al glossario */}
      <Link
        href={`/${lemmario.slug}`}
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Torna al glossario
      </Link>

      {/* Hero */}
      <header className="mb-12 text-center">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-3">
          Livelli di razionalit&agrave;
        </h1>
        <p className="font-sans text-[var(--color-text-body)] max-w-xl mx-auto">
          Classificazione dei lemmi in base al livello di astrazione e razionalit&agrave; matematica
          del concetto espresso.
        </p>
        <div className="mt-6 border-t border-[var(--color-border)]" />
      </header>

      {/* Livelli list */}
      <div className="space-y-12">
        {sortedLivelli.map((livello) => {
          const lemmi = lemmiPerLivello.get(livello.id) || []
          const livelloNumero = livello.numero ?? livello.livello ?? livello.ordine
          const livelloNome = livello.nome?.replace(/^Livello \d+ - /, '') || `Livello ${livelloNumero}`

          return (
            <section key={livello.id}>
              <div className="flex items-baseline gap-4 mb-4">
                <span className="font-serif text-3xl font-bold text-[var(--color-text)]">
                  {livelloNumero}.
                </span>
                <h2 className="font-serif text-2xl font-bold text-[var(--color-text)]">
                  {livelloNome}
                </h2>
              </div>

              {livello.descrizione && (
                <p className="font-sans text-sm text-[var(--color-text-body)] mb-4 leading-relaxed">
                  {livello.descrizione}
                </p>
              )}

              {lemmi.length > 0 ? (
                <div className="flex flex-wrap gap-x-1 gap-y-2">
                  <span className="label-uppercase text-[var(--color-text-muted)] self-center mr-2">
                    {lemmi.length} lemm{lemmi.length === 1 ? 'a' : 'i'}:
                  </span>
                  {lemmi.map((lemma, idx) => (
                    <span key={lemma.id}>
                      <Link
                        href={`/${lemmario.slug}/lemmi/${lemma.slug}`}
                        className="font-serif text-[var(--color-text)] hover:text-[var(--color-text-muted)] transition-colors underline decoration-dotted underline-offset-2"
                      >
                        {lemma.termine}
                      </Link>
                      {lemma.tipo === 'latino' && (
                        <span className="text-xs text-[var(--color-text-muted)] ml-0.5">(lat.)</span>
                      )}
                      {idx < lemmi.length - 1 && (
                        <span className="text-[var(--color-text-muted)]">, </span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-serif italic text-sm text-[var(--color-text-muted)]">
                  Nessun lemma associato a questo livello.
                </p>
              )}

              <div className="mt-6 border-t border-[var(--color-border)]" />
            </section>
          )
        })}
      </div>

      {sortedLivelli.length === 0 && (
        <div className="text-center py-16">
          <p className="font-serif italic text-[var(--color-text-muted)]">
            Nessun livello di razionalit&agrave; definito per questo lemmario.
          </p>
        </div>
      )}
    </div>
  )
}
