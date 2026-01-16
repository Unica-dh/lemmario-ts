import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLemmarioBySlug, getLemmaBySlug } from '@/lib/payload-api'
import type { Lemma } from '@/types/payload'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    'lemmario-slug': string
    termine: string
  }
}

export default async function LemmaPage({ params }: PageProps) {
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

  const lemma = lemmaData as Lemma & { definizioni?: any[] }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link href="/" className="hover:text-primary-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/${lemmario.slug}/`} className="hover:text-primary-600">
          {lemmario.titolo}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-semibold">{lemma.termine}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {lemma.termine}
        </h1>
        {lemma.tipo && (
          <p className="text-sm text-gray-600">
            Tipo: <span className="font-semibold">{lemma.tipo}</span>
          </p>
        )}
      </header>

      {/* Contenuto principale */}
      <main className="max-w-3xl">
        {/* Etimologia */}
        {lemma.etimologia && (
          <section className="mb-8 bg-blue-50 border border-blue-200 rounded p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Etimologia</h2>
            <p className="text-gray-700">{lemma.etimologia}</p>
          </section>
        )}

        {/* Note Redazionali */}
        {lemma.note_redazionali && (
          <section className="mb-8 bg-amber-50 border border-amber-200 rounded p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Note Redazionali</h2>
            <p className="text-gray-700 text-sm">{lemma.note_redazionali}</p>
          </section>
        )}

        {/* Definizioni - dal depth 2 vengono caricate */}
        {lemma.id && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Definizioni</h2>
            <div className="text-gray-600 text-sm">
              <p className="italic">Le definizioni caricate dalla API non sono ancora disponibili nel dettaglio.</p>
              <p className="mt-2">Lemma ID: {lemma.id}</p>
            </div>
          </section>
        )}
      </main>

      {/* Footer Navigation */}
      <nav className="mt-12 pt-6 border-t border-gray-200">
        <Link 
          href={`/${lemmario.slug}/`}
          className="inline-flex items-center text-primary-600 hover:text-primary-800"
        >
          ← Torna a {lemmario.titolo}
        </Link>
      </nav>
    </div>
  )
}
