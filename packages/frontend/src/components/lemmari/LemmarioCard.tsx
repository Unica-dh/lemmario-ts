/**
 * Lemmario Card Component
 * Displays a single lemmario in the homepage grid with optional photo
 */

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Lemmario, PayloadMedia } from '@/types/payload'
import { getMediaUrl } from '@/lib/media-url'

interface LemmarioCardProps {
  lemmario: Lemmario & { _count?: { lemmi?: number } }
}

export function LemmarioCard({ lemmario }: LemmarioCardProps) {
  const foto = typeof lemmario.foto === 'object' ? lemmario.foto as PayloadMedia : null
  const fotoUrl = foto ? getMediaUrl(foto.sizes?.card?.url || foto.url) : null

  return (
    <Link
      href={`/${lemmario.slug}`}
      className="group block transition-colors duration-200 hover:bg-[var(--color-bg-subtle)]"
      data-testid="lemmario-card"
    >
      {/* Foto */}
      {fotoUrl ? (
        <div className="aspect-[4/3] relative mb-4 overflow-hidden">
          <Image
            src={fotoUrl}
            alt={foto?.alt || lemmario.titolo}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] relative mb-4 bg-[var(--color-bg-subtle)] flex items-center justify-center">
          <svg
            className="w-16 h-16 text-[var(--color-text-disabled)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
      )}

      {/* Contenuto */}
      <div className="p-6">
        <h2 className="font-serif font-bold text-2xl text-[var(--color-text)] mb-2">
          {lemmario.titolo}
        </h2>

        <p className="label-uppercase text-xs text-[var(--color-text-muted)] mb-3">
          {lemmario._count?.lemmi || 0} lemmi
        </p>

        {lemmario.descrizione && (
          <p className="font-sans text-base text-[var(--color-text-body)] line-clamp-3">
            {lemmario.descrizione}
          </p>
        )}
      </div>
    </Link>
  )
}
