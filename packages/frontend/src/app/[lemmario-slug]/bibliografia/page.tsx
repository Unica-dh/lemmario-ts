import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getLemmarioBySlug, getAllFonti } from '@/lib/payload-api'
import type { PaginatedResponse, Ricorrenza } from '@/types/payload'
import { BibliografiaSearch } from '@/components/bibliografia/BibliografiaSearch'

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
    title: `Bibliografia - ${lemmario.titolo}`,
    description: `Fonti bibliografiche del ${lemmario.titolo}`,
  }
}

export default async function BibliografiaPage({ params }: PageProps) {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])

  if (!lemmario) {
    notFound()
  }

  // Fetch all fonti (shared across lemmari)
  const fonti = await getAllFonti()

  // Sort fonti alphabetically by shorthand_id
  const sortedFonti = [...fonti].sort((a, b) =>
    a.shorthand_id.localeCompare(b.shorthand_id, 'it')
  )

  // Fetch all ricorrenze to count per fonte
  // We fetch all ricorrenze and group by fonte ID
  let ricorrenzePerFonte = new Map<number, number>()
  try {
    const response = await fetch(`${API_URL}/ricorrenze?limit=2000&depth=0`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: process.env.NODE_ENV === 'production' ? 60 : 0 },
    })
    if (response.ok) {
      const data: PaginatedResponse<Ricorrenza> = await response.json()
      for (const r of data.docs) {
        const fonteId = typeof r.fonte === 'number' ? r.fonte : r.fonte?.id
        if (fonteId) {
          ricorrenzePerFonte.set(fonteId, (ricorrenzePerFonte.get(fonteId) || 0) + 1)
        }
      }
    }
  } catch {
    // Fallback: no ricorrenze counts
    ricorrenzePerFonte = new Map()
  }

  // Build fonti with ricorrenze count
  const fontiConRicorrenze = sortedFonti.map(fonte => ({
    fonte,
    ricorrenzeCount: ricorrenzePerFonte.get(fonte.id) || 0,
  }))

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
      <header className="mb-8 text-center">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-3">
          Bibliografia
        </h1>
        <p className="label-uppercase text-[var(--color-text-muted)]">
          {fonti.length} font{fonti.length === 1 ? 'e' : 'i'}
        </p>
        <div className="mt-6 border-t border-[var(--color-border)]" />
      </header>

      {/* Client-side search + grouped list */}
      <BibliografiaSearch fonti={fontiConRicorrenze} />
    </div>
  )
}
