'use client'

import { useEffect } from 'react'

// Hysteresis thresholds to prevent flickering feedback loop:
// The header collapses at 50px but only re-expands below 10px.
// Without this gap, collapsing the 44px bar shifts layout and can
// push scrollY back below the threshold, causing rapid toggling.
const SCROLL_DOWN_THRESHOLD = 50
const SCROLL_UP_THRESHOLD = 10

export function ScrollDetector() {
  useEffect(() => {
    let ticking = false
    let isScrolled = false

    const handleScroll = () => {
      if (ticking) return
      ticking = true

      requestAnimationFrame(() => {
        const scrollY = window.scrollY

        if (!isScrolled && scrollY > SCROLL_DOWN_THRESHOLD) {
          isScrolled = true
          document.documentElement.toggleAttribute('data-scrolled', true)
        } else if (isScrolled && scrollY < SCROLL_UP_THRESHOLD) {
          isScrolled = false
          document.documentElement.toggleAttribute('data-scrolled', false)
        }

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
