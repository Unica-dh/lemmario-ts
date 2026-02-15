'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface ParallaxLetterProps {
  letter: string
}

export function ParallaxLetter({ letter }: ParallaxLetterProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={letter}
          className="font-serif text-[40vw] md:text-[30vw] leading-none select-none"
          style={{ color: 'var(--color-text)' }}
          initial={shouldReduceMotion ? { opacity: 0.04 } : { opacity: 0, scale: 0.9 }}
          animate={shouldReduceMotion ? { opacity: 0.04 } : { opacity: 0.04, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0.04 } : { opacity: 0, scale: 1.05 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeInOut' }}
        >
          {letter}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
