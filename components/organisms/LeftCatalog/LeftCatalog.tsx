'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MegaMenu } from '@/components/molecules/MegaMenu/MegaMenu'
import styles from './LeftCatalog.module.scss'

interface Category {
  id: string
  name: string
  slug: string
  children?: Category[]
}

export function LeftCatalog() {
  const [categories, setCategories] = useState<Category[]>([])
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (data.success) {
          setCategories(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  const mainCategories = [
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

  const isActive = (slug: string) => {
    return pathname?.includes(`/catalog/${slug}`)
  }

  return (
    <>
      <aside className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ''}`}>
        <div className={styles.header}>
          <button
            className={styles.toggleButton}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Переключить каталог"
          >
            ☰
          </button>
          <span className={styles.title}>КАТАЛОГ</span>
        </div>
        <nav className={styles.nav}>
          {mainCategories.map((category) => (
            <div
              key={category.slug}
              className={`${styles.categoryItem} ${isActive(category.slug) ? styles.active : ''}`}
              onMouseEnter={() => setHoveredCategory(category.slug)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <Link
                href={`/catalog/${category.slug}`}
                className={styles.categoryLink}
              >
                {category.name}
                <span className={styles.arrow}>›</span>
              </Link>
            </div>
          ))}
        </nav>
      </aside>

      {hoveredCategory === 'samogonovarenie' && (
        <MegaMenu
          categorySlug="samogonovarenie"
          onClose={() => setHoveredCategory(null)}
        />
      )}
    </>
  )
}

