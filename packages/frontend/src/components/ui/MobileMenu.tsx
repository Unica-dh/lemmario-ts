'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface NavLink {
  href: string
  label: string
  isLemmarioSpecific?: boolean
}

interface MobileMenuProps {
  links: NavLink[]
}

export function MobileMenu({ links }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Close drawer on Escape and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Hamburger menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        aria-label="Menu"
        data-testid="mobile-menu-button"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Drawer overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
          data-testid="mobile-menu-overlay"
        >
          <div
            className="absolute top-0 right-0 bottom-0 w-64 bg-[var(--color-bg)] shadow-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Menu di navigazione"
            data-testid="mobile-menu-drawer"
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <h2 className="label-uppercase text-[var(--color-text-muted)]">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1"
                aria-label="Chiudi"
                data-testid="mobile-menu-close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation links */}
            <nav className="p-4">
              <ul className="space-y-1">
                {links.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className={`block px-3 py-2 rounded-md label-uppercase transition-colors ${
                        link.isLemmarioSpecific
                          ? 'text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] font-medium'
                          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
