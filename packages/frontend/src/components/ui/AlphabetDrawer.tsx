'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface AlphabetDrawerProps {
  lettereDisponibili: string[]
  activeLetter: string
  onLetterClick: (letter: string) => void
}

export function AlphabetDrawer({ lettereDisponibili, activeLetter, onLetterClick }: AlphabetDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLetterClick = (letter: string) => {
    onLetterClick(letter)
    setIsOpen(false)
  }

  const MotionButton = shouldReduceMotion ? 'button' : motion.button

  return (
    <>
      {/* FAB trigger */}
      <MotionButton
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 lg:hidden z-40 w-14 h-14 rounded-full bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)] shadow-lg flex items-center justify-center label-uppercase text-xs"
        aria-label="Apri navigazione alfabetica"
        data-testid="alphabet-fab"
        {...(!shouldReduceMotion && {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.4, delay: 0.5, ease: 'easeOut' },
        })}
      >
        {activeLetter || 'A-Z'}
      </MotionButton>

      {/* Drawer overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-[var(--color-bg)] rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Navigazione alfabetica"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="label-uppercase text-[var(--color-text-muted)]">Vai alla sezione</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1"
                aria-label="Chiudi"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-6 gap-3" data-testid="alphabet-drawer-grid">
              {ALPHABET.map((letter, index) => {
                const isDisabled = !lettereDisponibili.includes(letter)
                const isActive = activeLetter === letter

                const MotionOrButton = shouldReduceMotion ? 'button' : motion.button

                return (
                  <MotionOrButton
                    key={letter}
                    onClick={() => !isDisabled && handleLetterClick(letter)}
                    disabled={isDisabled}
                    className={`
                      aspect-square flex items-center justify-center
                      font-sans text-lg rounded-lg transition-colors
                      ${isActive
                        ? 'bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)] font-bold'
                        : isDisabled
                          ? 'text-[var(--color-text-disabled)] cursor-not-allowed'
                          : 'text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] cursor-pointer'
                      }
                    `}
                    aria-label={`Vai alla sezione ${letter}`}
                    {...(!shouldReduceMotion && {
                      initial: { opacity: 0, scale: 0.8 },
                      animate: { opacity: 1, scale: 1 },
                      transition: {
                        duration: 0.2,
                        delay: index * 0.02,
                        ease: 'easeOut',
                      },
                    })}
                  >
                    {letter}
                  </MotionOrButton>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
