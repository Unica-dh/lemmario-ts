import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getContenutoStaticoBySlug, getLemmarioBySlug } from '@/lib/payload-api'
import { LexicalRenderer } from '@/components/LexicalRenderer'
import type { Metadata } from 'next'
import type { LexicalContent } from '@/components/LexicalRenderer'

// Force dynamic rendering
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
    title: `${contenuto.titolo} - ${lemmario.titolo} - Lemmario`,
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
          <li>
            <Link href={`/${lemmario.slug}`} className="hover:text-primary-600">
              {lemmario.titolo}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-gray-900 font-medium">
            {contenuto.titolo}
          </li>
        </ol>
      </nav>

      <article className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="mb-2">
            <span className="inline-block px-3 py-1 text-sm font-medium text-primary-700 bg-primary-50 rounded-full">
              {lemmario.titolo}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {contenuto.titolo}
          </h1>
          {contenuto.updatedAt && (
            <p className="text-sm text-gray-500">
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
          className="prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary-600"
        />
      </article>
    </div>
  )
}
