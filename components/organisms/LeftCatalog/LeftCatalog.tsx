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
  _count?: {
    products: number
  }
  products?: { id: string }[]
}

const categoryIcons: Record<string, string> = {
  'pivovareniye': '🍺',
  'samogonovarenie': '⚗️',
  'vinodeliye': '🍷',
  'shlangi-soedineniya': '🔌',
  'tara-emkosti': '🪣',
  'bondarnye-izdeliya': '🪵',
  'kazany-tandyry-mangaly-pechi-posuda': '🔥',
  'vse-dlya-izgotovleniya-kolbas': '🥓',
  'syrodelie': '🧀',
  'izmeritelnoe-oborudovanie': '📊',
  'avtoklavy-koptilni': '🍖',
  'hleb-kvas': '🍞',
  'travy-specii': '🌿',
  'literatura': '📚',
}

export function LeftCatalog() {
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?includeProducts=true')
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

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev)
    window.addEventListener('toggle-catalog', handleToggle)
    return () => window.removeEventListener('toggle-catalog', handleToggle)
  }, [])

  const toggleCategory = (slug: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  const isActive = (slug: string) => {
    return pathname?.includes(`/catalog/${slug}`)
  }

  const getProductCount = (category: Category): number => {
    // Используем _count если доступен, иначе считаем products
    let count = category._count?.products || (category.products ? category.products.length : 0)
    if (category.children) {
      count += category.children.reduce((sum, child) => {
        return sum + (child._count?.products || 0)
      }, 0)
    }
    return count
  }

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <span className={styles.title}>Категории товаров</span>
        </div>
        
        <div className={styles.search}>
          <input
            type="text"
            placeholder="Поиск по категориям..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <nav className={styles.nav}>
          {filteredCategories.map((category) => {
            const hasChildren = category.children && category.children.length > 0
            const isExpanded = expandedCategories.has(category.slug)
            const productCount = getProductCount(category)
            const icon = categoryIcons[category.slug] || '📦'

            return (
              <div key={category.id}>
                <div
                  className={`${styles.categoryItem} ${isActive(category.slug) ? styles.active : ''}`}
                  onMouseEnter={() => setHoveredCategory(category.slug)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    href={`/catalog/${category.slug}`}
                    className={styles.categoryLink}
                  >
                    <span className={styles.icon}>{icon}</span>
                    <span className={styles.name}>{category.name}</span>
                  </Link>
                  {hasChildren && (
                    <button
                      className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleCategory(category.slug)
                      }}
                      aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
                    >
                      ›
                    </button>
                  )}
                </div>
                {hasChildren && isExpanded && (
                  <div className={styles.subcategories}>
                    {category.children?.map((child) => (
                      <Link
                        key={child.id}
                        href={`/catalog/${child.slug}`}
                        className={`${styles.subcategoryItem} ${isActive(child.slug) ? styles.active : ''}`}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
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
























