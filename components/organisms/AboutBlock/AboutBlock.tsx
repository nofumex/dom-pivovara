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


  const partners = [
    { name: 'СИВ', text: 'ВСЕ ДЛЯ ПРИГОТОВЛЕНИЯ СПИРТНЫХ НАПИТКОВ ДОМА' },
    { name: 'Ставбондарь', text: '' },
    { name: 'ВИНОКУР', text: 'Алтайский винокур' },
    { name: 'ДЕД АЛТАЙ', text: '' },
    { name: 'iplate', text: '' },
  ]

  return (
    <div ref={sectionRef} className={styles.about}>
      <div className="container">
        <div className={styles.content}>
          <div className={styles.imageWrapper}>
            <div
              className={styles.image}
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1556910103-2c027eb9ef25?w=800&h=600&fit=crop)',
              }}
            ></div>
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
        <div className={styles.partners}>
          <div className={styles.partnersGrid}>
            {partners.map((partner, index) => (
              <div key={index} className={styles.partnerLogo}>
                <div className={styles.partnerName}>{partner.name}</div>
                {partner.text && <div className={styles.partnerText}>{partner.text}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

