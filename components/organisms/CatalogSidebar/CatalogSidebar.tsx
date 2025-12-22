'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SidebarSections } from '../SidebarSections/SidebarSections'
import { getPlaceholderImage } from '@/lib/catalogData'
import styles from './CatalogSidebar.module.scss'

interface SubSubcategory {
  name: string
  slug: string
  image?: string
}

interface Subcategory {
  name: string
  slug: string
  image?: string
  count?: number
  subSubcategories?: SubSubcategory[]
}

interface Category {
  name: string
  slug: string
  image?: string
  subcategories: Subcategory[]
}

interface CatalogSidebarProps {
  categories?: Category[]
}

export function CatalogSidebar({ categories: initialCategories }: CatalogSidebarProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || [])
  const [isPanelLeaving, setIsPanelLeaving] = useState(false)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Если категории не переданы, загружаем их через API
  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) {
      fetch('/api/categories?includeProducts=true')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            // Преобразуем структуру данных из API в формат для сайдбара
            const transformedCategories = data.data.map((category: any) => {
              const subcategories = (category.other_Category || []).map((sub: any) => {
                // Нормализуем изображение: убираем пустые строки и null
                const subImage = sub.image && typeof sub.image === 'string' && sub.image.trim() !== '' ? sub.image : null
                
                return {
                  name: sub.name,
                  slug: sub.slug,
                  image: subImage, // Изображение подкатегории (из поля image или из товара)
                  count: sub._count?.Product || 0,
                  subSubcategories: (sub.other_Category || []).map((subSub: any) => {
                    const subSubImage = subSub.image && typeof subSub.image === 'string' && subSub.image.trim() !== '' ? subSub.image : null
                    return {
                      name: subSub.name,
                      slug: subSub.slug,
                      image: subSubImage, // Изображение под-подкатегории
                    }
                  }),
                }
              })
              
              return {
                name: category.name,
                slug: category.slug,
                image: category.image,
                subcategories,
              }
            })
            setCategories(transformedCategories)
          }
        })
        .catch(err => console.error('Failed to load categories:', err))
    } else {
      setCategories(initialCategories)
    }
  }, [initialCategories])
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isCatalogRoute = pathname.startsWith('/catalog')
  const isProductRoute = pathname.startsWith('/product')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [isCatalogHovered, setIsCatalogHovered] = useState(false)
  const isSidebarHoveredRef = useRef(false)
  const isSubcategoriesPanelHoveredRef = useRef(false)
  
  // Определяем активную категорию по pathname
  const getActiveCategorySlug = () => {
    if (!isCatalogRoute && !isProductRoute) return null
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
    if (!isHomePage && !isCatalogRoute && !isProductRoute) {
      // Закрываем только если курсор не находится ни в сайдбаре, ни в панели подкатегорий
      if (!isSidebarHoveredRef.current && !isSubcategoriesPanelHoveredRef.current) {
        setIsCatalogHovered(false)
      }
    }
  }, [isHomePage, isCatalogRoute, isProductRoute])

  useEffect(() => {
    // На главной странице, всех страницах каталога и страницах товаров всегда показываем сайдбар
    if (isHomePage || isCatalogRoute || isProductRoute) {
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
  }, [isHomePage, isCatalogRoute, isProductRoute, openSidebar, checkAndCloseSidebar])

  const showCategories = isHomePage || isCatalogRoute || isProductRoute || isCatalogHovered

  const handleSidebarEnter = () => {
    isSidebarHoveredRef.current = true
    openSidebar()
  }

  const handleSidebarLeave = () => {
    isSidebarHoveredRef.current = false
    // Если уходим с сайдбара, запускаем анимацию исчезновения панели
    if (hoveredCategory) {
      setIsPanelLeaving(true)
      leaveTimeoutRef.current = setTimeout(() => {
        setHoveredCategory(null)
        setIsPanelLeaving(false)
        checkAndCloseSidebar()
      }, 200)
    } else {
      // Проверяем, не находимся ли мы в панели подкатегорий
      checkAndCloseSidebar()
    }
  }

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
      }
    }
  }, [])

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
                {categories.map((category) => (
                  <div
                    key={category.slug}
                    className={styles.categoryItem}
                    onMouseEnter={() => {
                      // Отменяем анимацию исчезновения, если вернулись на категорию
                      if (leaveTimeoutRef.current) {
                        clearTimeout(leaveTimeoutRef.current)
                        leaveTimeoutRef.current = null
                      }
                      setIsPanelLeaving(false)
                      setHoveredCategory(category.slug)
                    }}
                    onMouseLeave={() => {
                      // Запускаем анимацию исчезновения панели
                      setIsPanelLeaving(true)
                      leaveTimeoutRef.current = setTimeout(() => {
                        setHoveredCategory(null)
                        setIsPanelLeaving(false)
                      }, 200) // Время анимации исчезновения
                    }}
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
                    {category.subcategories.length > 0 && (hoveredCategory === category.slug || isPanelLeaving) && (
                      <div 
                        className={`${styles.subcategoriesPanel} ${isPanelLeaving && hoveredCategory !== category.slug ? styles.leaving : ''}`}
                        onMouseEnter={() => {
                          // Отменяем анимацию исчезновения, если вернулись на панель
                          if (leaveTimeoutRef.current) {
                            clearTimeout(leaveTimeoutRef.current)
                            leaveTimeoutRef.current = null
                          }
                          setIsPanelLeaving(false)
                          setHoveredCategory(category.slug)
                          isSubcategoriesPanelHoveredRef.current = true
                          openSidebar() // Держим сайдбар открытым при наведении на подкатегории
                        }}
                        onMouseLeave={() => {
                          isSubcategoriesPanelHoveredRef.current = false
                          // Запускаем анимацию исчезновения
                          setIsPanelLeaving(true)
                          leaveTimeoutRef.current = setTimeout(() => {
                            setHoveredCategory(null)
                            setIsPanelLeaving(false)
                            checkAndCloseSidebar()
                          }, 200) // Время анимации исчезновения
                        }}
                      >
                        <div className={styles.subcategoriesContent}>
                          <div className={styles.categoryHeader}>
                            {category.image && (
                              <img
                                src={category.image}
                                alt={category.name}
                                className={styles.categoryImage}
                              />
                            )}
                            <h3 className={styles.subcategoriesTitle}>{category.name}</h3>
                          </div>
                          <div className={styles.subcategoriesGrid}>
                            {category.subcategories.map((subcategory) => (
                              <div key={subcategory.slug} className={styles.subcategoryCard}>
                                <Link
                                  href={`/catalog/${category.slug}/${subcategory.slug}`}
                                  className={styles.subcategoryHeader}
                                >
                                  <img
                                    src={subcategory.image || getPlaceholderImage(subcategory.name, 64)}
                                    alt={subcategory.name}
                                    className={styles.subcategoryImage}
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => {
                                      // Если изображение не загрузилось, используем placeholder
                                      const target = e.target as HTMLImageElement
                                      const placeholderUrl = getPlaceholderImage(subcategory.name, 64)
                                      if (target.src !== placeholderUrl) {
                                        target.src = placeholderUrl
                                      }
                                    }}
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

