'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface SearchBarProps {
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchBar({
  placeholder = 'Cerca un lemma...',
  debounceMs = 300,
  className = '',
}: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')

  // Debounced search with useCallback
  const updateSearchParam = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (value.trim()) {
        params.set('q', value.trim())
        params.set('page', '1') // Reset to page 1 on new search
      } else {
        params.delete('q')
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  // Debounce effect
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
    <div className={`relative ${className}`} data-testid="search-bar">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
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
          className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-500"
          data-testid="search-input"
          aria-label="Cerca lemmi"
        />

        {searchValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label="Cancella ricerca"
            data-testid="clear-search"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {searchValue && (
        <div className="mt-2 text-sm text-gray-600" data-testid="search-info">
          Ricerca: <span className="font-semibold">{searchValue}</span>
        </div>
      )}
    </div>
  )
}
