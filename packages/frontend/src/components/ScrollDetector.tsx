'use client'

import { useEffect } from 'react'

const SCROLL_THRESHOLD = 50

export function ScrollDetector() {
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (ticking) return
      ticking = true

      requestAnimationFrame(() => {
        const scrolled = window.scrollY > SCROLL_THRESHOLD
        document.documentElement.toggleAttribute('data-scrolled', scrolled)
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    // Set initial state
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return null
}
