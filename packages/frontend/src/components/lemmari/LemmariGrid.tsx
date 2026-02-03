/**
 * Lemmari Grid Component
 * Displays a responsive grid of lemmari cards
 */

'use client'

import React from 'react'
import { LemmarioCard } from './LemmarioCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import type { Lemmario } from '@/types/payload'

interface LemmariGridProps {
  lemmari: (Lemmario & { _count?: { lemmi?: number } })[]
  loading?: boolean
}

export function LemmariGrid({ lemmari, loading = false }: LemmariGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (lemmari.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-gray-400 mb-3">
          <svg 
            className="mx-auto h-12 w-12" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
            />
          </svg>
        </div>
        <p className="text-lg text-gray-600 mb-2">Nessun lemmario disponibile</p>
        <p className="text-sm text-gray-500">
          Al momento non ci sono lemmari pubblicati.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lemmari.map((lemmario) => (
        <LemmarioCard key={lemmario.id} lemmario={lemmario} />
      ))}
    </div>
  )
}
