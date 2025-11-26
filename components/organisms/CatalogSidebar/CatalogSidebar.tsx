'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SidebarSections } from '../SidebarSections/SidebarSections'
import { allCategories, getPlaceholderImage } from '@/lib/catalogData'
import styles from './CatalogSidebar.module.scss'

export function CatalogSidebar() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isCatalogRoute = pathname.startsWith('/catalog')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [isCatalogHovered, setIsCatalogHovered] = useState(false)
  const isSidebarHoveredRef = useRef(false)
  const isSubcategoriesPanelHoveredRef = useRef(false)
  
  // Определяем активную категорию по pathname
  const getActiveCategorySlug = () => {
    if (!isCatalogRoute) return null
    const pathParts = pathname.split('/').filter(Boolean)
    if (pathParts.length >= 2 && pathParts[0] === 'catalog') {
      return pathParts[1] // slug категории
    }
    return null
  }
  
  const activeCategorySlug = getActiveCategorySlug()
  
  // Функция для открытия сайдбара
  const openSidebar = useCallback(() => {
    setIsCatalogHovered(true)
  }, [])
  
  // Функция для проверки и закрытия сайдбара
  const checkAndCloseSidebar = useCallback(() => {
    if (!isHomePage && !isCatalogRoute) {
      // Закрываем только если курсор не находится ни в сайдбаре, ни в панели подкатегорий
      if (!isSidebarHoveredRef.current && !isSubcategoriesPanelHoveredRef.current) {
        setIsCatalogHovered(false)
      }
    }
  }, [isHomePage, isCatalogRoute])

  useEffect(() => {
    // На главной странице и всех страницах каталога всегда показываем сайдбар
    if (isHomePage || isCatalogRoute) {
      setIsCatalogHovered(true)
      return
    }

    const catalogButton = document.querySelector('[data-catalog-button]')
    if (!catalogButton) return

    const handleCatalogButtonEnter = () => {
      openSidebar()
    }
    
    const handleCatalogButtonLeave = () => {
      // При уходе с кнопки проверяем, не находимся ли мы в сайдбаре или панели подкатегорий
      checkAndCloseSidebar()
    }

    catalogButton.addEventListener('mouseenter', handleCatalogButtonEnter)
    catalogButton.addEventListener('mouseleave', handleCatalogButtonLeave)

    return () => {
      catalogButton.removeEventListener('mouseenter', handleCatalogButtonEnter)
      catalogButton.removeEventListener('mouseleave', handleCatalogButtonLeave)
    }
  }, [isHomePage, isCatalogRoute, openSidebar, checkAndCloseSidebar])

  const showCategories = isHomePage || isCatalogRoute || isCatalogHovered

  const handleSidebarEnter = () => {
    isSidebarHoveredRef.current = true
    openSidebar()
  }

  const handleSidebarLeave = () => {
    isSidebarHoveredRef.current = false
    // Проверяем, не находимся ли мы в панели подкатегорий
    checkAndCloseSidebar()
  }

  return (
    <>
      <div className={styles.sidebarContainer}>
        {showCategories && (
          <aside 
            className={styles.sidebar}
            onMouseEnter={handleSidebarEnter}
            onMouseLeave={handleSidebarLeave}
          >
            <div className={styles.content}>
              <div className={styles.list}>
                {allCategories.map((category) => (
                  <div
                    key={category.slug}
                    className={styles.categoryItem}
                    onMouseEnter={() => setHoveredCategory(category.slug)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <Link
                      href={`/catalog/${category.slug}`}
                      className={`${styles.item} ${activeCategorySlug === category.slug ? styles.active : ''}`}
                    >
                      <span className={styles.name}>{category.name}</span>
                      {category.subcategories.length > 0 && (
                        <span className={styles.arrow}>›</span>
                      )}
                    </Link>
                    {category.subcategories.length > 0 && hoveredCategory === category.slug && (
                      <div 
                        className={styles.subcategoriesPanel}
                        onMouseEnter={() => {
                          setHoveredCategory(category.slug)
                          isSubcategoriesPanelHoveredRef.current = true
                          openSidebar() // Держим сайдбар открытым при наведении на подкатегории
                        }}
                        onMouseLeave={() => {
                          setHoveredCategory(null)
                          isSubcategoriesPanelHoveredRef.current = false
                          // Проверяем, не находимся ли мы в сайдбаре
                          checkAndCloseSidebar()
                        }}
                      >
                        <div className={styles.subcategoriesContent}>
                          <h3 className={styles.subcategoriesTitle}>{category.name}</h3>
                          <div className={styles.subcategoriesGrid}>
                            {category.subcategories.map((subcategory) => (
                              <div key={subcategory.slug} className={styles.subcategoryCard}>
                                <Link
                                  href={`/catalog/${category.slug}/${subcategory.slug}`}
                                  className={styles.subcategoryHeader}
                                >
                                  <img
                                    src={getPlaceholderImage(subcategory.name, 64)}
                                    alt={subcategory.name}
                                    className={styles.subcategoryImage}
                                  />
                                  <div className={styles.subcategoryInfo}>
                                    <span className={styles.subcategoryName}>
                                      {subcategory.name}
                                    </span>
                                    {subcategory.count !== undefined && (
                                      <span className={styles.subcategoryCount}>
                                        {subcategory.count}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                                {subcategory.subSubcategories && subcategory.subSubcategories.length > 0 && (
                                  <ul className={styles.subSubcategoriesList}>
                                    {subcategory.subSubcategories.map((subSubcategory) => (
                                      <li key={subSubcategory.slug}>
                                        <Link
                                          href={`/catalog/${category.slug}/${subcategory.slug}/${subSubcategory.slug}`}
                                          className={styles.subSubcategoryItem}
                                        >
                                          {subSubcategory.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
        <SidebarSections />
      </div>
    </>
  )
}

