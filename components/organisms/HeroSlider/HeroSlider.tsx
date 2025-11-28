'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './HeroSlider.module.scss'

interface HeroImage {
  id: string
  url: string
  alt: string | null
  title: string | null
  text: string | null
  buttonText: string | null
  buttonUrl: string | null
  order: number
  isActive: boolean
}

export function HeroSlider() {
  const [slides, setSlides] = useState<HeroImage[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [autoSlideInterval, setAutoSlideInterval] = useState(5000) // По умолчанию 5 секунд
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Загружаем слайды и настройки
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const [slidesResponse, settingsResponse] = await Promise.all([
          fetch('/api/hero-images'),
          fetch('/api/public-settings'),
        ])

        const slidesData = await slidesResponse.json()
        const settingsData = await settingsResponse.json()

        if (slidesData.success) {
          const activeSlides = slidesData.data.filter((slide: HeroImage) => slide.isActive)
          setSlides(activeSlides)
        }

        if (settingsData.success && settingsData.data.heroSliderInterval) {
          const interval = parseInt(settingsData.data.heroSliderInterval)
          setAutoSlideInterval(interval >= 2000 ? interval : 5000) // Минимум 2 секунды
        }
      } catch (error) {
        console.error('Error fetching hero slides:', error)
      }
    }

    fetchSlides()
  }, [])

  // Автоматическая смена слайдов
  useEffect(() => {
    if (slides.length <= 1) return

    const startAutoSlide = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      }, Math.max(autoSlideInterval, 2000)) // Минимум 2 секунды
    }

    startAutoSlide()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [slides.length, autoSlideInterval])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    // Сбрасываем таймер при ручном переключении
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    // Перезапускаем таймер через небольшую задержку
    if (slides.length > 1) {
      setTimeout(() => {
        intervalRef.current = setInterval(() => {
          setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, Math.max(autoSlideInterval, 2000))
      }, 100)
    }
  }

  const goToPrevious = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    goToSlide((currentSlide + 1) % slides.length)
  }

  if (slides.length === 0) {
    return null
  }

  const currentSlideData = slides[currentSlide]

  return (
    <div className={styles.slider}>
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
        >
          <div
            className={styles.background}
            style={{ backgroundImage: `url(${slide.url})` }}
          />
          <div className={styles.overlay}></div>
          {index === currentSlide && (
            <div className={styles.content}>
              <div className={styles.left}>
                <div className={styles.textContent}>
                  {slide.title && (
                    <div className={styles.title}>{slide.title}</div>
                  )}
                  {slide.text && (
                    <div className={styles.description}>{slide.text}</div>
                  )}
                  {slide.buttonText && slide.buttonUrl && (
                    <div className={styles.buttons}>
                      <Link href={slide.buttonUrl}>
                        <button className={styles.buttonPrimary}>
                          {slide.buttonText}
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            className={styles.arrowLeft}
            onClick={goToPrevious}
            aria-label="Предыдущий слайд"
          >
            ‹
          </button>
          <button
            className={styles.arrowRight}
            onClick={goToNext}
            aria-label="Следующий слайд"
          >
            ›
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
        </>
      )}
    </div>
  )
}
