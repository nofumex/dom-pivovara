'use client'

import Link from 'next/link'
import styles from './CatalogSidebar.module.scss'

// Список всех категорий
const allCategories = [
  { name: 'Пивоварение', slug: 'pivovareniye' },
  { name: 'Самогоноварение', slug: 'samogonovarenie' },
  { name: 'Виноделие', slug: 'vinodeliye' },
  { name: 'Шланги, соединения', slug: 'shlangi-soedineniya' },
  { name: 'Тара и ёмкости', slug: 'tara-emkosti' },
  { name: 'Бондарные изделия', slug: 'bondarnye-izdeliya' },
  { name: 'Казаны, тандыры, мангалы, печи, посуда', slug: 'kazany-tandyry-mangaly-pechi-posuda' },
  { name: 'Всё для изготовления колбас', slug: 'vse-dlya-izgotovleniya-kolbas' },
  { name: 'Сыроделие', slug: 'syrodelie' },
  { name: 'Измерительное оборудование', slug: 'izmeritelnoe-oborudovanie' },
  { name: 'Автоклавы и коптильни', slug: 'avtoklavy-koptilni' },
  { name: 'Хлеб и квас', slug: 'hleb-kvas' },
  { name: 'Травы и специи', slug: 'travy-specii' },
  { name: 'Литература', slug: 'literatura' },
]

export function CatalogSidebar() {
  return (
    <div className={styles.sidebarContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.content}>
          <div className={styles.list}>
            {allCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/catalog/${category.slug}`}
                className={styles.item}
              >
                <span className={styles.name}>{category.name}</span>
                <span className={styles.arrow}>›</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

