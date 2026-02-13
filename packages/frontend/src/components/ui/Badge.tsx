/**
 * Badge Component
 * Small labeled component for tags, status indicators
 * Design system: maiuscoletto grigio, nessuno sfondo
 */

import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'muted' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  'data-testid'?: string
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  'data-testid': testId
}: BadgeProps) {
  const variantClasses = {
    default: 'text-[var(--color-text-muted)]',
    muted: 'text-[var(--color-text-disabled)]',
    warning: 'text-[var(--color-text-muted)] bg-[var(--color-bg-subtle)]',
    danger: 'text-[var(--color-text)] bg-[var(--color-bg-subtle)]',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }

  return (
    <span
      className={`inline-flex items-center label-uppercase rounded ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      data-testid={testId}
    >
      {children}
    </span>
  )
}
