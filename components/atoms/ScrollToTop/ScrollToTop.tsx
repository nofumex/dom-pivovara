'use client'

import { useState, useEffect } from 'react'
import styles from './ScrollToTop.module.scss'

interface ScrollToTopProps {
  targetId?: string
}

export function ScrollToTop({ targetId }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const scrollElement =
      (targetId ? document.getElementById(targetId) : null) || window

    const toggleVisibility = () => {
      const scrollTop =
        scrollElement instanceof Window
          ? window.scrollY
          : scrollElement.scrollTop

      if (scrollTop > 600) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    scrollElement.addEventListener('scroll', toggleVisibility)

    return () => {
      scrollElement.removeEventListener('scroll', toggleVisibility)
    }
  }, [targetId])

  const scrollToTop = () => {
    const element = targetId ? document.getElementById(targetId) : null

    if (element) {
      element.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <button
      className={styles.button}
      onClick={scrollToTop}
      aria-label="Наверх"
    >
      ↑
    </button>
  )
}


























