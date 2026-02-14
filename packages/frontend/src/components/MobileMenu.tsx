'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

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
  const [mounted, setMounted] = useState(false)

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  const drawer = isOpen && mounted ? createPortal(
    <div
      className="fixed inset-0 z-[70] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu di navigazione"
      id="mobile-menu-drawer"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer panel (slide from right) */}
      <nav
        className="absolute top-0 right-0 bottom-0 w-72 max-w-[80vw] bg-[var(--color-bg)] shadow-xl flex flex-col animate-slide-in-right"
        aria-label="Menu principale"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <span className="label-uppercase text-[var(--color-text-muted)]">Menu</span>
          <button
            onClick={close}
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] transition-colors"
            aria-label="Chiudi menu"
            data-testid="mobile-menu-close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto py-4" role="list">
          {links.map((link, index) => {
            const prevIsGlobal = index > 0 && !links[index - 1].isLemmarioSpecific
            const showSeparator = link.isLemmarioSpecific && (index === 0 || prevIsGlobal)

            return (
              <div key={link.href} role="listitem">
                {showSeparator && (
                  <div className="mx-6 my-2 border-t border-[var(--color-border)]" />
                )}
                <Link
                  href={link.href}
                  onClick={close}
                  className="flex items-center min-h-[44px] px-6 py-3 text-sm font-medium text-[var(--color-text-body)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                >
                  {link.label}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Footer: ThemeToggle */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between">
          <span className="label-uppercase text-[var(--color-text-muted)]">Tema</span>
          <ThemeToggle />
        </div>
      </nav>
    </div>,
    document.body
  ) : null

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center justify-center w-11 h-11 -mr-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] transition-colors"
        aria-label="Apri menu di navigazione"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-drawer"
        data-testid="mobile-menu-button"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {drawer}
    </>
  )
}
