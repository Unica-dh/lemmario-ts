import Link from 'next/link'
import { getLemmari } from '@/lib/payload-api'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function Home() {
  const lemmariData = await getLemmari({ limit: 10, where: { attivo: { equals: true } } })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Lemmario
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Dizionario specializzato della terminologia matematica ed economica
          italiana storica da statuti e documenti medievali e rinascimentali
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/lemmi"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Esplora i lemmi
          </Link>
          <Link
            href="/ricerca"
            className="bg-white text-primary-600 border-2 border-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Ricerca avanzata
          </Link>
        </div>
      </section>

      {/* Lemmari Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Dizionari disponibili</h2>

        {lemmariData.docs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Nessun dizionario disponibile al momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lemmariData.docs.map((lemmario) => (
              <Link
                key={lemmario.id}
                href={`/lemmari/${lemmario.slug}`}
                className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {lemmario.titolo}
                </h3>
                {lemmario.descrizione && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {lemmario.descrizione}
                  </p>
                )}
                {lemmario.periodo_storico && (
                  <p className="text-sm text-gray-500">
                    Periodo: {lemmario.periodo_storico}
                  </p>
                )}
                <div className="mt-4 text-primary-600 font-medium">
                  Esplora →
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-12 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Fonti storiche</h3>
            <p className="text-gray-600">
              Citazioni da documenti e statuti medievali e rinascimentali
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Ricerca avanzata</h3>
            <p className="text-gray-600">
              Cerca per termine, periodo storico o livello di razionalità
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Collegamenti</h3>
            <p className="text-gray-600">
              Esplora relazioni tra termini, sinonimi e riferimenti incrociati
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
