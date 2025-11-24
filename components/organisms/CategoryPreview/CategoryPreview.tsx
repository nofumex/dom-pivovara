import Link from 'next/link'
import styles from './CategoryPreview.module.scss'

const categories = [
  {
    slug: 'pivovareniye',
    title: 'Пивоварение',
    size: 'large',
    gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
  },
  {
    slug: 'samogonovarenie',
    title: 'Самогоноварение',
    size: 'medium',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    slug: 'vinodeliye',
    title: 'Виноделие',
    size: 'medium',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    slug: 'kazany',
    title: 'Казаны, мангалы, печи, посуда',
    size: 'small',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    slug: 'bondarnye',
    title: 'Бондарные изделия',
    size: 'large',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    slug: 'syrodelie',
    title: 'Сыроделие',
    size: 'small',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
]

export function CategoryPreview() {
  return (
    <div className={styles.preview}>
      <div className="container">
        <div className={styles.grid}>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/catalog/${category.slug}`}
              className={`${styles.tile} ${styles[category.size]}`}
              style={{ background: category.gradient }}
            >
              <div className={styles.label}>{category.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

