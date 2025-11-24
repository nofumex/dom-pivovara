'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './HeroSlider.module.scss'

const slides = [
  {
    id: 1,
    title: 'Акция',
    subtitle: 'Хмель',
    price: 'от 99 руб.',
    description: 'Акция! Снижение цены на популярные сорта хмеля',
    buttonText1: 'Подробнее об акции',
    buttonText2: 'Каталог',
  },
]

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <div className={styles.slider}>
      <div className={styles.slide}>
        <div className={styles.background}>
          <div className={styles.sky}></div>
          <div className={styles.ground}></div>
        </div>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.textContent}>
              <div className={styles.title}>{slides[currentSlide].title}</div>
              <div className={styles.subtitle}>{slides[currentSlide].subtitle}</div>
              <div className={styles.price}>{slides[currentSlide].price}</div>
              <div className={styles.description}>{slides[currentSlide].description}</div>
              <div className={styles.buttons}>
                <Link href="/sales">
                  <button className={styles.buttonPrimary}>
                    {slides[currentSlide].buttonText1}
                  </button>
                </Link>
                <Link href="/catalog">
                  <button className={styles.buttonSecondary}>
                    {slides[currentSlide].buttonText2}
                  </button>
                </Link>
              </div>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.hopsImage}>
              <div className={styles.hopCone}></div>
              <div className={styles.hopCone}></div>
              <div className={styles.hopCone}></div>
              <div className={styles.hopLeaf}></div>
              <div className={styles.hopLeaf}></div>
            </div>
          </div>
        </div>

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
