'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SidebarSections } from '../SidebarSections/SidebarSections'
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
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [categoryProducts, setCategoryProducts] = useState<any[]>([])
  const [isCatalogHovered, setIsCatalogHovered] = useState(false)

  useEffect(() => {
    if (isHomePage) return // На главной странице всегда показываем

    const catalogButton = document.querySelector('[data-catalog-button]')
    const sidebarContainer = document.querySelector(`.${styles.sidebarContainer}`)
    if (!catalogButton || !sidebarContainer) return

    let timeoutId: NodeJS.Timeout

    const handleMouseEnter = () => {
      clearTimeout(timeoutId)
      setIsCatalogHovered(true)
    }
    
    const handleMouseLeave = () => {
      timeoutId = setTimeout(() => {
        setIsCatalogHovered(false)
      }, 200) // Небольшая задержка для плавного перехода
    }

    const handleSidebarEnter = () => {
      clearTimeout(timeoutId)
      setIsCatalogHovered(true)
    }

    const handleSidebarLeave = () => {
      timeoutId = setTimeout(() => {
        setIsCatalogHovered(false)
      }, 200)
    }

    catalogButton.addEventListener('mouseenter', handleMouseEnter)
    catalogButton.addEventListener('mouseleave', handleMouseLeave)
    sidebarContainer.addEventListener('mouseenter', handleSidebarEnter)
    sidebarContainer.addEventListener('mouseleave', handleSidebarLeave)

    return () => {
      clearTimeout(timeoutId)
      catalogButton.removeEventListener('mouseenter', handleMouseEnter)
      catalogButton.removeEventListener('mouseleave', handleMouseLeave)
      sidebarContainer.removeEventListener('mouseenter', handleSidebarEnter)
      sidebarContainer.removeEventListener('mouseleave', handleSidebarLeave)
    }
  }, [isHomePage])

  useEffect(() => {
    if (hoveredCategory) {
      const fetchProducts = async () => {
        try {
          const response = await fetch(`/api/products?category=${hoveredCategory}&limit=6`)
          const data = await response.json()
          if (data.success) {
            setCategoryProducts(data.data || [])
          }
        } catch (error) {
          console.error('Error fetching category products:', error)
          setCategoryProducts([])
        }
      }
      fetchProducts()
    } else {
      setCategoryProducts([])
    }
  }, [hoveredCategory])

  const showCategories = isHomePage || isCatalogHovered

  return (
    <>
      <div className={styles.sidebarContainer}>
        {showCategories && (
          <aside className={styles.sidebar}>
            <div className={styles.content}>
              <div className={styles.list}>
                {allCategories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/catalog/${category.slug}`}
                    className={styles.item}
                    onMouseEnter={() => setHoveredCategory(category.slug)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <span className={styles.name}>{category.name}</span>
                    <span className={styles.arrow}>›</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
        <SidebarSections />
      </div>
      
      {hoveredCategory && categoryProducts.length > 0 && (
        <div 
          className={styles.productsPreview}
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <div className={styles.productsPreviewContent}>
            <h3 className={styles.productsPreviewTitle}>
              {allCategories.find(c => c.slug === hoveredCategory)?.name}
            </h3>
            <div className={styles.productsGrid}>
              {categoryProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className={styles.productCard}
                >
                  <div className={styles.productImage}>
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.title} />
                    ) : (
                      <div className={styles.productPlaceholder}>📦</div>
                    )}
                  </div>
                  <div className={styles.productTitle}>{product.title}</div>
                  <div className={styles.productPrice}>
                    {new Intl.NumberFormat('ru-RU').format(product.price)} ₽
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href={`/catalog/${hoveredCategory}`}
              className={styles.viewAllLink}
            >
              Смотреть все →
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

