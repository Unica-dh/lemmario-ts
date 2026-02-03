import Link from 'next/link'
import type { Lemma } from '@/types/payload'
import { Badge } from '@/components/ui/Badge'

interface LemmiListProps {
  lemmi: Lemma[]
  lemmarioSlug: string
  className?: string
}

export function LemmiList({ lemmi, lemmarioSlug, className = '' }: LemmiListProps) {
  if (lemmi.length === 0) {
    return (
      <div className="text-center py-12" data-testid="empty-state">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Nessun lemma trovato</h3>
        <p className="mt-2 text-sm text-gray-500">
          Prova a modificare i filtri o la ricerca.
        </p>
      </div>
    )
  }

  return (
    <div className={`divide-y divide-gray-200 ${className}`} data-testid="lemmi-list">
      {lemmi.map((lemma) => (
        <Link
          key={lemma.id}
          href={`/${lemmarioSlug}/lemmi/${lemma.slug}`}
          className="block py-4 px-4 hover:bg-gray-50 transition-colors rounded-lg"
          data-testid="lemma-item"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {lemma.termine}
                </h3>
                <Badge
                  variant={lemma.tipo === 'latino' ? 'primary' : 'success'}
                  size="sm"
                  data-testid="lemma-type"
                >
                  {lemma.tipo === 'latino' ? 'Latino' : 'Volgare'}
                </Badge>
              </div>

              {lemma.etimologia && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  <span className="font-medium">Etimologia:</span> {lemma.etimologia}
                </p>
              )}

              {lemma._status && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={lemma._status === 'published' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {lemma._status === 'published' ? 'Pubblicato' : 'Bozza'}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
