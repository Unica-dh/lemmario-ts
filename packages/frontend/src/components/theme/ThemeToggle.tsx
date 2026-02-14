'use client'

import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-11 h-11 rounded-lg transition-colors hover:bg-[var(--color-bg-subtle)]"
      aria-label={`Attiva modalità ${resolvedTheme === 'dark' ? 'chiara' : 'scura'}`}
      title={`Modalità ${resolvedTheme === 'dark' ? 'chiara' : 'scura'}`}
    >
      {/* Icona cerchio mezzo nero/mezzo bianco */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[var(--color-text)]"
      >
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
        <path
          d="M12 2 A 10 10 0 0 1 12 22 Z"
          fill="currentColor"
        />
      </svg>
    </button>
  )
}
