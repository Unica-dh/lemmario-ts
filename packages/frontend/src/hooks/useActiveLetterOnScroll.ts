'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Tracks which letter section is currently visible in the viewport
 * using IntersectionObserver on sentinel elements.
 */
export function useActiveLetterOnScroll(letters: string[]) {
  const [activeLetter, setActiveLetter] = useState(letters[0] || 'A')
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())

  const registerSection = useCallback(
    (letter: string) => (element: HTMLElement | null) => {
      if (element) {
        sectionRefs.current.set(letter, element)
      } else {
        sectionRefs.current.delete(letter)
      }
    },
    []
  )

  useEffect(() => {
    const sections = sectionRefs.current
    if (sections.size === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          const letter = visible[0].target.getAttribute('data-letter')
          if (letter) setActiveLetter(letter)
        }
      },
      {
        // Active zone is the top 30% of the viewport
        rootMargin: '0px 0px -70% 0px',
        threshold: 0,
      }
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [letters])

  return { activeLetter, registerSection }
}
