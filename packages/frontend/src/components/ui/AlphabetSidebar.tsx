'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface AlphabetSidebarProps {
  lettereDisponibili: string[]
  activeLetter: string
  onLetterClick: (letter: string) => void
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// 26 letters, 6s total → ~230ms stagger between each
const STAGGER_DELAY = 6 / ALPHABET.length

export function AlphabetSidebar({ lettereDisponibili, activeLetter, onLetterClick }: AlphabetSidebarProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <aside
      className="fixed left-3 top-3 hidden lg:block z-[60]"
      data-testid="alphabet-sidebar"
    >
      <nav className="flex flex-col space-y-0.5" aria-label="Navigazione alfabetica">
        {ALPHABET.map((letter, index) => {
          const isDisabled = !lettereDisponibili.includes(letter)
          const isActive = activeLetter === letter

          const MotionOrButton = shouldReduceMotion ? 'button' : motion.button

          return (
            <MotionOrButton
              key={letter}
              onClick={() => !isDisabled && onLetterClick(letter)}
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
              aria-label={`Vai alla sezione ${letter}`}
              aria-current={isActive ? 'true' : undefined}
              {...(!shouldReduceMotion && {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: {
                  duration: 0.3,
                  delay: index * STAGGER_DELAY,
                  ease: 'easeOut',
                },
              })}
            >
              {letter}
            </MotionOrButton>
          )
        })}
      </nav>
    </aside>
  )
}
