import { getAllLemmariWithStats } from '@/lib/payload-api'
import { LemmariGrid } from '@/components/lemmari/LemmariGrid'
import MainNav from '@/components/MainNav'
import { FadeIn } from '@/components/animations/FadeIn'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Glossari - Centro Interdipartimentale per l\'Umanistica Digitale - Universita degli Studi di Cagliari',
  description: 'Dizionari storici della terminologia matematica ed economica italiana. Centro Interdipartimentale per l\'Umanistica Digitale dell\'Universita degli Studi di Cagliari.',
  openGraph: {
    title: 'Glossari - Dizionari Storici della Terminologia Italiana',
    description: 'Dizionari storici della terminologia matematica ed economica italiana. Centro Interdipartimentale per l\'Umanistica Digitale',
  },
}

export const dynamic = 'force-dynamic'

export default async function Home() {
  const lemmari = await getAllLemmariWithStats()

  return (
    <>
      <MainNav />
      <main className="flex-1 bg-[var(--color-bg)]">
        <div className="container mx-auto px-4 md:px-20 py-10 md:py-16">
          {/* Hero section */}
          <FadeIn direction="up" delay={0}>
            <div className="text-center mb-8 md:mb-12">
              <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-[var(--color-text)] mb-4">
                Glossario
              </h1>
              <div className="flex items-center justify-center">
                <div className="w-64 h-px bg-[var(--color-border)]" />
              </div>
              <p className="font-serif italic text-base text-[var(--color-text-muted)] mt-4">
                {lemmari.length} {lemmari.length === 1 ? 'glossario disponibile' : 'glossari disponibili'}
              </p>
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={200}>
            <LemmariGrid lemmari={lemmari} />
          </FadeIn>
        </div>
      </main>
    </>
  )
}
