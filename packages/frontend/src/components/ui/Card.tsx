/**
 * Card Component
 * Reusable card container with consistent styling
 */

import React from 'react'
import Link from 'next/link'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  'data-testid'?: string
}

export function Card({ 
  children, 
  className = '', 
  hover = false,
  'data-testid': testId
}: CardProps) {
  const hoverClasses = hover 
    ? 'hover:shadow-lg hover:border-primary-300 transition-all duration-200' 
    : ''

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg ${hoverClasses} ${className}`}
      data-testid={testId}
    >
      {children}
    </div>
  )
}

interface CardLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  'data-testid'?: string
}

export function CardLink({ 
  href, 
  children, 
  className = '',
  'data-testid': testId
}: CardLinkProps) {
  return (
    <Link 
      href={href}
      className={`block bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-primary-300 transition-all duration-200 ${className}`}
      data-testid={testId}
    >
      {children}
    </Link>
  )
}
