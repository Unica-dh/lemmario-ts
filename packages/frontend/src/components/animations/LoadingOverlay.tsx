'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface LoadingOverlayProps {
  isLoading: boolean
}

export function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-10 flex items-start justify-center pt-16 bg-[rgba(0,0,0,0.15)] dark:bg-[rgba(255,255,255,0.1)]"
          style={{ pointerEvents: 'all' }}
          aria-label="Caricamento risultati"
          role="status"
        >
          <div className="loading-spinner" />
          <span className="sr-only">Caricamento...</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
