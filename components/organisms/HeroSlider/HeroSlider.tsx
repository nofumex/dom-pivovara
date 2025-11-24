'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import styles from './HeroSlider.module.scss'

const slides = [
  {
    id: 1,
    title: 'Скидки',
    buttonText: 'Узнать больше о скидках',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 2,
    title: 'Новинки',
    buttonText: 'Смотреть новинки',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: 3,
    title: 'Акции',
    buttonText: 'Все акции',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
]

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (isHovered) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isHovered])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div
      className={styles.slider}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={styles.slide}
        style={{ background: slides[currentSlide].gradient }}
      >
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.giftBox}></div>
          </div>
          <div className={styles.right}>
            <h2 className={styles.title}>{slides[currentSlide].title}</h2>
            <div className={styles.symbol}>π%</div>
            <Button
              variant="primary"
              onClick={() => {
                // Navigate to sales page
              }}
            >
              {slides[currentSlide].buttonText}
            </Button>
          </div>
        </div>

        <button
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={prevSlide}
          aria-label="Предыдущий слайд"
        >
          ←
        </button>
        <button
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={nextSlide}
          aria-label="Следующий слайд"
        >
          →
        </button>

        <div className={styles.dots}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentSlide ? styles.active : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Слайд ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
