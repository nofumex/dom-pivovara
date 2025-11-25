'use client'

import Link from 'next/link'
import styles from './ManufacturersBlock.module.scss'

const manufacturers = [
  {
    slug: 'samogon-i-vodka',
    name: 'Самогон и Водка',
    image: '/images/СамогониВодка.jpg',
  },
  {
    slug: 'stavbondar',
    name: 'Ставбондарь',
    image: '/images/Ставбондарь.jpg',
  },
  {
    slug: 'altayskiy-vinokur',
    name: 'Алтайский винокур',
    image: '/images/АлтайскийВинокур.jpg',
  },
  {
    slug: 'ded-altay',
    name: 'Дед Алтай',
    image: '/images/ДедАлтай.jpg',
  },
  {
    slug: 'iplate',
    name: 'IPlate',
    image: '/images/Iplate.jpg',
  },
]

export function ManufacturersBlock() {
  return (
    <div className={styles.manufacturers}>
      <div className="container">
        <h2 className={styles.title}>Производители</h2>
        <div className={styles.grid}>
          {manufacturers.map((manufacturer) => (
            <Link
              key={manufacturer.slug}
              href={`/manufacturers/${manufacturer.slug}`}
              className={styles.card}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={manufacturer.image}
                  alt={manufacturer.name}
                  className={styles.image}
                />
              </div>
              <div className={styles.name}>{manufacturer.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

