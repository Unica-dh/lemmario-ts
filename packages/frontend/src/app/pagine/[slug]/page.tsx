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
    <div className="container mx-auto px-4 py-12 max-w-[700px]">
      <article>
        <header className="mb-10 pb-8 border-b border-[var(--color-border)]">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-4">
            {contenuto.titolo}
          </h1>
        </header>

        <LexicalRenderer
          content={contenuto.contenuto as unknown as LexicalContent}
        />
      </article>
    </div>
  )
}
