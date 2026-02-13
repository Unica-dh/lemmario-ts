import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getContenutoStaticoBySlug, getLemmarioBySlug } from '@/lib/payload-api'
import { LexicalRenderer } from '@/components/LexicalRenderer'
import type { Metadata } from 'next'
import type { LexicalContent } from '@/components/LexicalRenderer'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    'lemmario-slug': string
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])
  if (!lemmario) {
    return { title: 'Lemmario non trovato' }
  }

  const contenuto = await getContenutoStaticoBySlug(params.slug, lemmario.id)
  if (!contenuto) {
    return { title: 'Pagina non trovata' }
  }

  return {
    title: `${contenuto.titolo} - ${lemmario.titolo}`,
  }
}

export default async function LemmarioContenutoStaticoPage({ params }: PageProps) {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])

  if (!lemmario) {
    notFound()
  }

  const contenuto = await getContenutoStaticoBySlug(params.slug, lemmario.id)

  if (!contenuto) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-[700px]">
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

      <article>
        <header className="mb-10 pb-8 border-b border-[var(--color-border)]">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-4">
            {contenuto.titolo}
          </h1>
          {contenuto.updatedAt && (
            <p className="label-uppercase text-[var(--color-text-muted)]">
              Ultimo aggiornamento:{' '}
              {new Date(contenuto.updatedAt).toLocaleDateString('it-IT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </header>

        <LexicalRenderer
          content={contenuto.contenuto as unknown as LexicalContent}
        />
      </article>
    </div>
  )
}
