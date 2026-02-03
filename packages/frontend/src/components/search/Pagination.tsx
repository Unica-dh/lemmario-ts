'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
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

  // Calculate range of items shown
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers to show
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    const maxPagesToShow = 7

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first, last, current, and nearby pages with ellipsis
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`} data-testid="pagination">
      {/* Results info */}
      <div className="text-sm text-gray-700">
        Risultati <span className="font-semibold">{startItem}</span> -{' '}
        <span className="font-semibold">{endItem}</span> di{' '}
        <span className="font-semibold">{totalItems}</span>
      </div>

      {/* Page buttons */}
      <nav className="flex items-center gap-1" aria-label="Paginazione">
        {/* Previous button */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            px-3 py-2 rounded-lg font-medium transition-colors
            ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }
          `}
          aria-label="Pagina precedente"
          data-testid="prev-page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                ...
              </span>
            )
          }

          const pageNum = page as number
          const isActive = pageNum === currentPage

          return (
            <button
              key={pageNum}
              onClick={() => goToPage(pageNum)}
              className={`
                px-3 py-2 rounded-lg font-medium transition-colors min-w-[40px]
                ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
              aria-label={`Pagina ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`page-${pageNum}`}
            >
              {pageNum}
            </button>
          )
        })}

        {/* Next button */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            px-3 py-2 rounded-lg font-medium transition-colors
            ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }
          `}
          aria-label="Pagina successiva"
          data-testid="next-page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  )
}
