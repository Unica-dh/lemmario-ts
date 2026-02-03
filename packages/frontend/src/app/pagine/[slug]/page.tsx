import { notFound } from 'next/navigation'
import { getContenutoStaticoBySlug } from '@/lib/payload-api'
import { LexicalRenderer } from '@/components/LexicalRenderer'
import type { Metadata } from 'next'
import type { LexicalContent } from '@/components/LexicalRenderer'

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const contenuto = await getContenutoStaticoBySlug(params.slug)

  if (!contenuto) {
    return {
      title: 'Pagina non trovata',
    }
  }

  return {
    title: `${contenuto.titolo} - Lemmario`,
  }
}

export default async function ContenutoStaticoPage({ params }: PageProps) {
  const contenuto = await getContenutoStaticoBySlug(params.slug)

  if (!contenuto) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-4xl mx-auto">
        <header className="mb-8">
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
