'use client'

import { useEffect } from 'react'
import { useTypewriter } from '@/hooks/useTypewriter'

interface TypewriterPlaceholderProps {
  words: string[]
  isFocused: boolean
  hasValue: boolean
}

export function TypewriterPlaceholder({ words, isFocused, hasValue }: TypewriterPlaceholderProps) {
  const { text, pause, resume } = useTypewriter(
    words.map((w) => `Cerca \u201C${w}\u201D...`),
    { typeSpeed: 80, deleteSpeed: 40, pauseTime: 2000 }
  )

  const shouldHide = isFocused || hasValue

  useEffect(() => {
    if (shouldHide) {
      pause()
    } else {
      resume()
    }
  }, [shouldHide, pause, resume])

  if (shouldHide) {
    return null
  }

  return (
    <span
      className="absolute inset-y-0 left-8 flex items-center pointer-events-none font-sans text-base text-[var(--color-text-muted)]"
      aria-hidden="true"
    >
      {text}
      <span className="animate-blink ml-px">|</span>
    </span>
  )
}
