'use client'

import { useState, useEffect, useMemo } from 'react'
import { FonteCard } from './FonteCard'
import type { Fonte } from '@/types/payload'

interface FonteConRicorrenze {
  fonte: Fonte
  ricorrenzeCount: number
}

interface BibliografiaSearchProps {
  fonti: FonteConRicorrenze[]
}

export function BibliografiaSearch({ fonti }: BibliografiaSearchProps) {
  const [searchValue, setSearchValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchValue.trim().toLowerCase())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue])

  // Filter fonti
  const filteredFonti = useMemo(() => {
    if (!debouncedQuery) return fonti
    return fonti.filter(({ fonte }) =>
      fonte.shorthand_id.toLowerCase().includes(debouncedQuery) ||
      fonte.titolo?.toLowerCase().includes(debouncedQuery) ||
      fonte.riferimento_completo?.toLowerCase().includes(debouncedQuery) ||
      fonte.autore?.toLowerCase().includes(debouncedQuery)
    )
  }, [fonti, debouncedQuery])

  // Group by first letter
  const grouped = useMemo(() => {
    const groups = new Map<string, FonteConRicorrenze[]>()
    for (const item of filteredFonti) {
      const letter = item.fonte.shorthand_id[0]?.toUpperCase() || '#'
      const existing = groups.get(letter) || []
      existing.push(item)
      groups.set(letter, existing)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filteredFonti])

  return (
    <>
      {/* Search bar */}
      <div className="mb-12 max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-[var(--color-text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Cerca una fonte..."
            className="w-full pl-8 pr-10 py-3 bg-transparent border-0 border-b-2 border-[var(--color-border)] font-sans text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] transition-colors"
            aria-label="Cerca fonti"
          />

          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute inset-y-0 right-0 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              aria-label="Cancella ricerca"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search results info */}
      {debouncedQuery && (
        <div className="text-center mb-8 text-sm text-[var(--color-text-muted)]">
          {filteredFonti.length > 0 ? (
            <>
              Trovate <span className="font-semibold">{filteredFonti.length}</span> font{filteredFonti.length === 1 ? 'e' : 'i'}
              {' '}per &ldquo;<span className="font-semibold">{debouncedQuery}</span>&rdquo;
            </>
          ) : (
            <>
              Nessuna fonte trovata per &ldquo;
              <span className="font-semibold">{debouncedQuery}</span>&rdquo;
            </>
          )}
        </div>
      )}

      {/* Grouped fonti list */}
      <div className="space-y-8">
        {grouped.map(([letter, items]) => (
          <section key={letter}>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="font-serif text-2xl font-bold text-[var(--color-text)]">
                {letter}
              </h2>
              <div className="flex-1 border-t border-[var(--color-border)]" />
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {items.map(({ fonte, ricorrenzeCount }) => (
                <FonteCard
                  key={fonte.id}
                  fonte={fonte}
                  ricorrenzeCount={ricorrenzeCount}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Empty state */}
      {grouped.length === 0 && !debouncedQuery && (
        <div className="text-center py-16">
          <p className="font-serif italic text-[var(--color-text-muted)]">
            Nessuna fonte disponibile.
          </p>
        </div>
      )}
    </>
  )
}
