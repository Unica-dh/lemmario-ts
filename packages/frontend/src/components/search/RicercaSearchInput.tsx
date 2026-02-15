'use client'

import { useState } from 'react'
import { TypewriterPlaceholder } from './TypewriterPlaceholder'

interface RicercaSearchInputProps {
  defaultValue: string
  sampleTerms: string[]
}

export function RicercaSearchInput({ defaultValue, sampleTerms }: RicercaSearchInputProps) {
  const [value, setValue] = useState(defaultValue)
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="relative">
      {sampleTerms.length > 0 && (
        <TypewriterPlaceholder
          words={sampleTerms}
          isFocused={isFocused}
          hasValue={value.length > 0}
        />
      )}
      <input
        type="text"
        id="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={sampleTerms.length > 0 ? '' : 'Es: additio, camera, libro...'}
        className="w-full pl-8 pr-4 py-3 bg-transparent border-0 border-b-2 border-[var(--color-border)] font-sans text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] transition-colors"
      />
    </div>
  )
}
