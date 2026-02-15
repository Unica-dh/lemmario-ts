'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'

interface AlphabetSidebarProps {
  lettereDisponibili: string[]
  letteraAttiva?: string
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function AlphabetSidebar({ lettereDisponibili, letteraAttiva }: AlphabetSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const shouldReduceMotion = useReducedMotion()

  const handleLetterClick = (letter: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (letteraAttiva === letter) {
      params.delete('lettera')
    } else {
      params.set('lettera', letter)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const MotionAside = shouldReduceMotion ? 'aside' : motion.aside

  return (
    <MotionAside
      className="fixed left-3 top-3 hidden lg:block z-[60]"
      data-testid="alphabet-sidebar"
      {...(!shouldReduceMotion && {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.5, delay: 0.3, ease: 'easeOut' },
      })}
    >
      <nav className="flex flex-col space-y-0.5" aria-label="Filtro alfabetico">
        {ALPHABET.map((letter) => {
          const isDisabled = !lettereDisponibili.includes(letter)
          const isActive = letteraAttiva === letter

          return (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              disabled={isDisabled}
              className={`
                w-8 h-7 flex items-center justify-center
                font-sans text-sm transition-all duration-200
                ${isActive
                  ? 'bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)] font-bold'
                  : isDisabled
                    ? 'text-[var(--color-text-disabled)] cursor-not-allowed'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] cursor-pointer'
                }
              `}
              aria-label={`Filtra per lettera ${letter}`}
              aria-current={isActive ? 'true' : undefined}
            >
              {letter}
            </button>
          )
        })}
      </nav>
    </MotionAside>
  )
}
