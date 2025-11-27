'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/atoms/Button/Button'
import styles from './AboutBlock.module.scss'

export function AboutBlock() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])


  const manufacturers = [
    { slug: 'samogon-i-vodka', image: '/images/СамогониВодка.jpg' },
    { slug: 'stavbondar', image: '/images/Ставбондарь.jpg' },
    { slug: 'altayskiy-vinokur', image: '/images/АлтайскийВинокур.jpg' },
    { slug: 'ded-altay', image: '/images/ДедАлтай.jpg' },
    { slug: 'iplate', image: '/images/Iplate.jpg' },
  ]

  return (
    <div ref={sectionRef} className={styles.about}>
      <div className="container">
        <div className={styles.content}>
          <div className={styles.imageWrapper}>
            <img
              src="/images/aboutPivovar.png"
              alt="О ДомПивоваре"
              className={styles.image}
            />
          </div>
          <div className={styles.text}>
            <h2 className={styles.title}>О ДомПивоваре</h2>
            <div className={styles.description}>
              <p>
                Сайт, торгующий товарами в Интернете. Позволяет пользователям сформировать заказ на покупку, выбрать способ оплаты и доставки заказа в сети Интернет. Выбрав необходимые товары или услуги, пользователь обычно имеет возможность тут же на сайте выбрать метод оплаты и доставки.
              </p>
              <p>
                Основное отличие Интернет-магазина от традиционного — в типе торговой площадки.
              </p>
            </div>
            <Link href="/about">
              <Button variant="outline" className={styles.moreButton}>Подробнее</Button>
            </Link>
          </div>
        </div>
        <div className={styles.manufacturers}>
          <Link href="/manufacturers" className={styles.manufacturersTitle}>
            <h3>Производители</h3>
          </Link>
          <div className={styles.manufacturersGrid}>
            {manufacturers.map((manufacturer) => (
              <Link
                key={manufacturer.slug}
                href={`/manufacturers/${manufacturer.slug}`}
                className={styles.manufacturerLogo}
              >
                <img
                  src={manufacturer.image}
                  alt=""
                  className={styles.manufacturerImage}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


