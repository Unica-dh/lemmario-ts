'use client'

export type TipoFilter = 'latino' | 'volgare'

interface TypeFilterPillsProps {
  activeFilters: TipoFilter[]
  onToggle: (tipo: TipoFilter) => void
  counts?: { latino: number; volgare: number }
}

export function TypeFilterPills({ activeFilters, onToggle, counts }: TypeFilterPillsProps) {
  const pills: Array<{ value: TipoFilter; label: string }> = [
    { value: 'volgare', label: 'Volgare' },
    { value: 'latino', label: 'Latino' },
  ]

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Filtra per tipo">
      {pills.map(({ value, label }) => {
        const isActive = activeFilters.includes(value)
        const count = counts?.[value]

        return (
          <button
            key={value}
            onClick={() => onToggle(value)}
            className={`
              label-uppercase px-3 py-1.5 rounded-full transition-all duration-200
              ${isActive
                ? 'border border-[var(--color-text)] text-[var(--color-text)]'
                : 'border border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
              }
            `}
            aria-pressed={isActive}
            aria-label={`Filtra per ${label}`}
            data-testid={`filter-pill-${value}`}
          >
            {label}
            {typeof count === 'number' && (
              <span className={`ml-1 ${isActive ? 'opacity-60' : 'opacity-40'}`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
