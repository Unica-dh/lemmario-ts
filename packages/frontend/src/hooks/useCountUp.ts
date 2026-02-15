'use client'

import { useState, useEffect, useRef } from 'react'

interface UseCountUpOptions {
  duration?: number
  startOnMount?: boolean
}

export function useCountUp(
  endValue: number,
  { duration = 1500, startOnMount = false }: UseCountUpOptions = {}
) {
  const [count, setCount] = useState(startOnMount ? 0 : endValue)
  const [hasStarted, setHasStarted] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || hasStarted) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out: decelerates toward the end
      const eased = 1 - Math.pow(1 - progress, 3)

      setCount(Math.round(eased * endValue))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    setCount(0)
    requestAnimationFrame(animate)
  }, [hasStarted, endValue, duration])

  return { count, ref: elementRef }
}
