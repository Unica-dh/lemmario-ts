'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SearchBar } from './SearchBar'
import { LoadingOverlay } from '@/components/animations/LoadingOverlay'

interface SearchWithOverlayProps {
  children: ReactNode
  sampleTerms?: string[]
  filterKey?: string
  className?: string
}

export function SearchWithOverlay({
  children,
  sampleTerms = [],
  filterKey = 'default',
  className = '',
}: SearchWithOverlayProps) {
  const [isLoading, setIsLoading] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading)
  }, [])

  return (
    <>
      <div className={`mb-8 md:mb-12 ${className}`}>
        <SearchBar
          sampleTerms={sampleTerms}
          onLoadingChange={handleLoadingChange}
        />
      </div>

      <div className="relative">
        <LoadingOverlay isLoading={isLoading} />
        {shouldReduceMotion ? (
          children
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filterKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </>
  )
}
