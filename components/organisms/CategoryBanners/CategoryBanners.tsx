import Link from 'next/link'
import styles from './CategoryBanners.module.scss'

interface Category {
  name: string
  slug: string
  imageUrl: string
  searchTerm: string
}

const categories: Category[] = [
  {
    name: 'Пивоварение',
    slug: 'pivovareniye',
    searchTerm: 'beer brewing wheat barley',
    imageUrl: 'https://picsum.photos/seed/brewing/600/400',
  },
  {
    name: 'Самогоноварение',
    slug: 'samogonovarenie',
    searchTerm: 'distillery moonshine still',
    imageUrl: 'https://picsum.photos/seed/distillery/600/400',
  },
  {
    name: 'Виноделие',
    slug: 'vinodeliye',
    searchTerm: 'wine grapes vineyard',
    imageUrl: 'https://picsum.photos/seed/wine/600/400',
  },
  {
    name: 'Казаны, мангалы, печи, посуда',
    slug: 'kazany-tandyry-mangaly-pechi-posuda',
    searchTerm: 'cauldron pot cooking',
    imageUrl: 'https://picsum.photos/seed/cauldron/600/400',
  },
  {
    name: 'Бондарные изделия',
    slug: 'bondarnye-izdeliya',
    searchTerm: 'barrel wooden cask',
    imageUrl: 'https://picsum.photos/seed/barrel/600/400',
  },
  {
    name: 'Сыроделие',
    slug: 'syrodelie',
    searchTerm: 'cheese dairy',
    imageUrl: 'https://picsum.photos/seed/cheese/600/400',
  },
]

export function CategoryBanners() {
  return (
    <div className={styles.banners}>
      <div className={styles.grid}>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/catalog/${category.slug}`}
            className={styles.banner}
          >
            <div className={styles.imageWrapper}>
              <img
                src={category.imageUrl}
                alt={category.name}
                className={styles.image}
                loading="lazy"
              />
              <div className={styles.overlay} />
            </div>
            <div className={styles.title}>{category.name}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

