'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface SearchBarProps {
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchBar({
  placeholder = 'Cerca un termine nel glossario...',
  debounceMs = 300,
  className = '',
}: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')

  const updateSearchParam = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value.trim()) {
        params.set('q', value.trim())
        params.delete('lettera')
        params.delete('page')
      } else {
        params.delete('q')
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (searchParams.get('q') || '')) {
        updateSearchParam(searchValue)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchValue, debounceMs, searchParams, updateSearchParam])

  const handleClear = () => {
    setSearchValue('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`} data-testid="search-bar">
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
          placeholder={placeholder}
          className="w-full pl-8 pr-10 py-3 bg-transparent border-0 border-b-2 border-[var(--color-border)] font-sans text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] transition-colors"
          data-testid="search-input"
          aria-label="Cerca lemmi"
        />

        {searchValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            aria-label="Cancella ricerca"
            data-testid="clear-search"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
