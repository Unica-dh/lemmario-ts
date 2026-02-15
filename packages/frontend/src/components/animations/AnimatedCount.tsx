'use client'

import { useCountUp } from '@/hooks/useCountUp'

interface AnimatedCountProps {
  value: number
  suffix?: string
}

export function AnimatedCount({ value, suffix }: AnimatedCountProps) {
  const { count, ref } = useCountUp(value, { duration: 3000 })

  return (
    <span ref={ref}>
      {count}{suffix ? ` ${suffix}` : ''}
    </span>
  )
}
