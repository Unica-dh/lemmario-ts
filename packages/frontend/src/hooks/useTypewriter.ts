'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseTypewriterOptions {
  typeSpeed?: number
  deleteSpeed?: number
  pauseTime?: number
}

export function useTypewriter(
  words: string[],
  { typeSpeed = 80, deleteSpeed = 40, pauseTime = 2000 }: UseTypewriterOptions = {}
) {
  const [text, setText] = useState('')
  const [isActive, setIsActive] = useState(true)
  const wordIndexRef = useRef(0)
  const charIndexRef = useRef(0)
  const isDeletingRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pause = useCallback(() => {
    setIsActive(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const resume = useCallback(() => {
    setIsActive(true)
  }, [])

  useEffect(() => {
    if (!isActive || words.length === 0) return

    const currentWord = words[wordIndexRef.current % words.length]

    const tick = () => {
      if (isDeletingRef.current) {
        charIndexRef.current--
        setText(currentWord.slice(0, charIndexRef.current))

        if (charIndexRef.current === 0) {
          isDeletingRef.current = false
          wordIndexRef.current = (wordIndexRef.current + 1) % words.length
          timeoutRef.current = setTimeout(tick, typeSpeed)
        } else {
          timeoutRef.current = setTimeout(tick, deleteSpeed)
        }
      } else {
        charIndexRef.current++
        setText(currentWord.slice(0, charIndexRef.current))

        if (charIndexRef.current === currentWord.length) {
          isDeletingRef.current = true
          timeoutRef.current = setTimeout(tick, pauseTime)
        } else {
          timeoutRef.current = setTimeout(tick, typeSpeed)
        }
      }
    }

    timeoutRef.current = setTimeout(tick, typeSpeed)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isActive, words, typeSpeed, deleteSpeed, pauseTime])

  return { text, pause, resume, isActive }
}
