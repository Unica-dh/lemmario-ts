/**
 * Lemmario Card Component
 * Displays a single lemmario in the grid
 */

'use client'

import React from 'react'
import { CardLink } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Lemmario } from '@/types/payload'

interface LemmarioCardProps {
  lemmario: Lemmario & { _count?: { lemmi?: number } }
}

export function LemmarioCard({ lemmario }: LemmarioCardProps) {
  // Truncate description to 2 lines (approximately 120 chars)
  const truncatedDescription = lemmario.descrizione 
    ? lemmario.descrizione.length > 120 
      ? `${lemmario.descrizione.substring(0, 120)}...` 
      : lemmario.descrizione
    : null

  return (
    <CardLink 
      href={`/${lemmario.slug}`}
      className="p-6"
      data-testid="lemmario-card"
    >
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-xl font-bold text-gray-900 flex-1">
          {lemmario.titolo}
        </h2>
        {lemmario.attivo === false && (
          <Badge variant="warning" size="sm">
            Non attivo
          </Badge>
        )}
      </div>

      {truncatedDescription && (
        <p className="text-gray-600 mb-4 line-clamp-2">
          {truncatedDescription}
        </p>
      )}

      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
        {lemmario._count?.lemmi !== undefined && (
          <div data-testid="lemmi-count">
            <span className="font-semibold">{lemmario._count.lemmi}</span> lemmi
          </div>
        )}
        
        {lemmario.periodo_storico && (
          <div>
            <span className="font-semibold">Periodo:</span> {lemmario.periodo_storico}
          </div>
        )}
      </div>

      {lemmario.data_pubblicazione && (
        <div className="mt-3 text-xs text-gray-400">
          Pubblicato: {new Date(lemmario.data_pubblicazione).toLocaleDateString('it-IT')}
        </div>
      )}
    </CardLink>
  )
}
