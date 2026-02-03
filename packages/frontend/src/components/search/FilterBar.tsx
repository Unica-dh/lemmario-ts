'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type FilterOption = 'tutti' | 'latino' | 'volgare'

interface FilterBarProps {
  className?: string
  showCount?: boolean
  counts?: {
    tutti: number
    latino: number
    volgare: number
  }
}

export function FilterBar({ className = '', showCount = false, counts }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentFilter = (searchParams.get('tipo') || 'tutti') as FilterOption

  const handleFilterChange = (tipo: FilterOption) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (tipo === 'tutti') {
      params.delete('tipo')
    } else {
      params.set('tipo', tipo)
    }
    
    params.set('page', '1') // Reset to page 1 on filter change

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const filters: Array<{ value: FilterOption; label: string }> = [
    { value: 'tutti', label: 'Tutti i lemmi' },
    { value: 'latino', label: 'Latino' },
    { value: 'volgare', label: 'Volgare' },
  ]

  return (
    <div className={`${className}`} data-testid="filter-bar">
      <div className="flex flex-wrap gap-2">
        {filters.map(({ value, label }) => {
          const isActive = currentFilter === value
          const count = counts?.[value]

          return (
            <button
              key={value}
              onClick={() => handleFilterChange(value)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }
              `}
              data-testid={`filter-${value}`}
              aria-pressed={isActive}
              aria-label={`Filtra per ${label}`}
            >
              {label}
              {showCount && typeof count === 'number' && (
                <span
                  className={`ml-2 ${
                    isActive ? 'text-primary-100' : 'text-gray-500'
                  }`}
                >
                  ({count})
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
