'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  className = '',
}: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`, { scroll: true })
  }

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <nav
      className={`flex items-center justify-center space-x-6 mt-12 pt-8 border-t border-[var(--color-border)] ${className}`}
      aria-label="Paginazione"
      data-testid="pagination"
    >
      {/* Previous */}
      {currentPage > 1 ? (
        <button
          onClick={() => goToPage(currentPage - 1)}
          className="label-uppercase text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          aria-label="Pagina precedente"
          data-testid="prev-page"
        >
          Precedente
        </button>
      ) : (
        <span className="label-uppercase text-xs text-[var(--color-text-disabled)] cursor-not-allowed">
          Precedente
        </span>
      )}

      {/* Page numbers */}
      <div className="flex items-center space-x-4">
        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="text-[var(--color-text-muted)]">
              &hellip;
            </span>
          ) : (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`label-uppercase text-xs transition-colors ${
                page === currentPage
                  ? 'text-[var(--color-text)] font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
              aria-label={`Pagina ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              data-testid={`page-${page}`}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next */}
      {currentPage < totalPages ? (
        <button
          onClick={() => goToPage(currentPage + 1)}
          className="label-uppercase text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          aria-label="Pagina successiva"
          data-testid="next-page"
        >
          Successiva
        </button>
      ) : (
        <span className="label-uppercase text-xs text-[var(--color-text-disabled)] cursor-not-allowed">
          Successiva
        </span>
      )}
    </nav>
  )
}
