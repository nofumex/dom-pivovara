'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProductCard } from '@/components/molecules/ProductCard/ProductCard'
import styles from './SalesSlider.module.scss'

interface Product {
  id: string
  title: string
  slug: string
  price: number | string
  oldPrice?: number | string
  images?: string[]
  badges?: string[]
  stockStatus?: string
  rating?: number
}

interface SalesSliderProps {
  products?: Product[]
}

export function SalesSlider({ products = [] }: SalesSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (isHovered || products.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, Math.ceil(products.length / 4) - 1)
        return (prev + 1) % (maxIndex + 1)
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [isHovered, products.length])

  if (products.length === 0) {
    return null
  }

  const itemsPerSlide = 4
  const maxIndex = Math.max(0, Math.ceil(products.length / itemsPerSlide) - 1)
  const currentProducts = products.slice(
    currentIndex * itemsPerSlide,
    (currentIndex + 1) * itemsPerSlide
  )

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % (maxIndex + 1))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + maxIndex + 1) % (maxIndex + 1))
  }

  return (
    <section
      className={styles.slider}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>Акционные товары</h2>
        <Link href="/sales" className={styles.viewAll}>
          Смотреть все →
        </Link>
      </div>

      <div className={styles.container}>
        <button
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={prevSlide}
          aria-label="Предыдущий слайд"
          disabled={maxIndex === 0}
        >
          ←
        </button>

        <div className={styles.slide}>
          {currentProducts.map((product) => (
            <div key={product.id} className={styles.productWrapper}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <button
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={nextSlide}
          aria-label="Следующий слайд"
          disabled={maxIndex === 0}
        >
          →
        </button>
      </div>

      {maxIndex > 0 && (
        <div className={styles.dots}>
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Слайд ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}


