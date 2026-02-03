import { getAllLemmariWithStats } from '@/lib/payload-api'
import { LemmariGrid } from '@/components/lemmari/LemmariGrid'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lemmari - Dizionario del Razionale',
  description:
    'Esplora i dizionari storici del Razionale. Scopri lemmi latini e volgari con definizioni, fonti e riferimenti storici.',
  openGraph: {
    title: 'Lemmari - Dizionario del Razionale',
    description: 'Esplora i dizionari storici del Razionale',
  },
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function Home() {
  const lemmari = await getAllLemmariWithStats()

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Lemmari
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Esplora i dizionari storici. Seleziona un lemmario per visualizzare lemmi, definizioni e fonti.
            </p>
          </div>

          <LemmariGrid lemmari={lemmari} />
        </div>
      </main>
      <Footer />
    </>
  )
}
