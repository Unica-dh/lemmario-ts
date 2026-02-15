'use client'

import { useState, useMemo, useCallback } from 'react'
import { useActiveLetterOnScroll } from '@/hooks/useActiveLetterOnScroll'
import { ParallaxLetter } from '@/components/ui/ParallaxLetter'
import { AlphabetSidebar } from '@/components/ui/AlphabetSidebar'
import { AlphabetDrawer } from '@/components/ui/AlphabetDrawer'
import { SearchBar } from '@/components/search/SearchBar'
import { LetterSection } from './LetterSection'
import type { LetterGroup } from './LetterSection'

interface LemmarioScrollViewProps {
  letterGroups: LetterGroup[]
  lettereDisponibili: string[]
  lemmarioSlug: string
  sampleTerms: string[]
  totalCount: number
}

export function LemmarioScrollView({
  letterGroups,
  lettereDisponibili,
  lemmarioSlug,
  sampleTerms,
  totalCount,
}: LemmarioScrollViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { activeLetter, registerSection } = useActiveLetterOnScroll(lettereDisponibili)

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return letterGroups

    const lowerQuery = searchQuery.toLowerCase()
    return letterGroups
      .map((group) => ({
        ...group,
        lemmi: group.lemmi.filter(
          (lemma) =>
            lemma.termine.toLowerCase().includes(lowerQuery) ||
            lemma.preview.toLowerCase().includes(lowerQuery)
        ),
      }))
      .filter((group) => group.lemmi.length > 0)
  }, [letterGroups, searchQuery])

  const filteredCount = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.lemmi.length, 0),
    [filteredGroups]
  )

  const filteredLetters = useMemo(
    () => filteredGroups.map((g) => g.letter),
    [filteredGroups]
  )

  const scrollToSection = useCallback((letter: string) => {
    const section = document.getElementById(`section-${letter}`)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  return (
    <div className="relative">
      {/* Parallax background letter */}
      <ParallaxLetter letter={searchQuery ? (filteredLetters[0] || 'A') : activeLetter} />

      {/* Alphabet sidebar (desktop) */}
      <AlphabetSidebar
        lettereDisponibili={searchQuery ? filteredLetters : lettereDisponibili}
        activeLetter={searchQuery ? (filteredLetters[0] || '') : activeLetter}
        onLetterClick={scrollToSection}
      />

      {/* Alphabet drawer (mobile) */}
      <AlphabetDrawer
        lettereDisponibili={searchQuery ? filteredLetters : lettereDisponibili}
        activeLetter={searchQuery ? (filteredLetters[0] || '') : activeLetter}
        onLetterClick={scrollToSection}
      />

      {/* Main content */}
      <div className="container mx-auto px-4 md:px-20 py-8 md:py-12 relative z-10">
        {/* Search bar - sticky below nav */}
        <div
          className="sticky top-[2.75rem] z-20 pb-4 pt-2 -mx-4 px-4 md:-mx-20 md:px-20 mb-4"
          style={{ background: 'linear-gradient(to bottom, var(--color-bg) 50%, transparent)' }}
        >
          <SearchBar
            sampleTerms={sampleTerms}
            onSearchChange={handleSearchChange}
          />
        </div>

        {/* Search results info */}
        {searchQuery && (
          <div className="text-center mb-8 text-sm text-[var(--color-text-muted)]">
            {filteredCount > 0 ? (
              <>
                Trovati <span className="font-semibold">{filteredCount}</span> risultati
                per &ldquo;<span className="font-semibold">{searchQuery}</span>&rdquo;
              </>
            ) : (
              <>
                Nessun risultato per &ldquo;
                <span className="font-semibold">{searchQuery}</span>&rdquo;
              </>
            )}
          </div>
        )}

        {/* Letter sections */}
        {filteredGroups.length > 0 ? (
          <div>
            {filteredGroups.map((group) => (
              <LetterSection
                key={group.letter}
                letter={group.letter}
                lemmi={group.lemmi}
                lemmarioSlug={lemmarioSlug}
                registerRef={registerSection(group.letter)}
              />
            ))}
          </div>
        ) : (
          <EmptyState searchQuery={searchQuery} />
        )}
      </div>
    </div>
  )
}

function EmptyState({ searchQuery }: { searchQuery?: string }) {
  return (
    <div className="text-center py-16" data-testid="empty-state">
      <svg
        className="mx-auto h-12 w-12 text-[var(--color-text-disabled)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
      <h3 className="mt-4 font-serif text-lg text-[var(--color-text)]">Nessun lemma trovato</h3>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        {searchQuery
          ? 'Prova a modificare la ricerca.'
          : 'Nessun lemma disponibile.'}
      </p>
    </div>
  )
}
