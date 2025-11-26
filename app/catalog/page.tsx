import Link from 'next/link'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { allCategories, getPlaceholderImage } from '@/lib/catalogData'
import styles from './page.module.scss'

export default function CatalogPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Каталог', href: '/catalog' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Каталог</h1>
        <div className={styles.grid}>
          {allCategories.map((category) => (
            <div key={category.slug} className={styles.card}>
            <Link
              href={`/catalog/${category.slug}`}
                className={styles.cardLink}
            >
                <img
                  src={getPlaceholderImage(category.name, 140)}
                  alt={category.name}
                className={styles.image}
              />
              <div className={styles.content}>
                <h2 className={styles.cardTitle}>{category.name}</h2>
                </div>
              </Link>
              {category.subcategories.length > 0 && (
                <div className={styles.subcategories}>
                  {category.subcategories.map((subcategory) => (
                    <Link
                      key={subcategory.slug}
                      href={`/catalog/${category.slug}/${subcategory.slug}`}
                      className={styles.subcategoryItem}
                    >
                      <span className={styles.subcategoryName}>
                        {subcategory.name}
                      </span>
                      {subcategory.count !== undefined && (
                        <span className={styles.subcategoryCount}>
                          {subcategory.count}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                )}
              </div>
          ))}
        </div>
      </div>
    </main>
  )
}
