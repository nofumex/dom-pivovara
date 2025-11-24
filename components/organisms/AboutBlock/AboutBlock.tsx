import Link from 'next/link'
import { Button } from '@/components/atoms/Button/Button'
import styles from './AboutBlock.module.scss'

export function AboutBlock() {
  return (
    <div className={styles.about}>
      <div className={styles.content}>
        <div className={styles.imageWrapper}>
          <div className={styles.image}></div>
        </div>
        <div className={styles.text}>
          <h2 className={styles.title}>О ДомПивоваре</h2>
          <p className={styles.description}>
            ДомПивовар — это интернет-магазин, специализирующийся на товарах для домашнего
            пивоварения, самогоноварения и виноделия. Мы предлагаем широкий ассортимент
            качественного оборудования, ингредиентов и аксессуаров для создания напитков в
            домашних условиях. Наша миссия — сделать процесс создания напитков доступным и
            увлекательным для каждого.
          </p>
          <Link href="/about">
            <Button variant="outline">Подробнее</Button>
          </Link>
        </div>
      </div>
      <div className={styles.partners}>
        <div className="container">
          <div className={styles.partnersGrid}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.partnerLogo}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

