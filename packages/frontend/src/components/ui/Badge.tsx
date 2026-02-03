/**
 * Badge Component
 * Small labeled component for tags, status indicators, etc.
 */

import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
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
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return (
    <span 
      className={`inline-flex items-center font-medium rounded ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      data-testid={testId}
    >
      {children}
    </span>
  )
}
