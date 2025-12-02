'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './CategoryTreeManager.module.scss'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parentId: string | null
  isActive: boolean
  sortOrder: number
  Category: {
    id: string
    name: string
    slug: string
  } | null
  other_Category: Array<{
    id: string
    name: string
    slug: string
    sortOrder: number
    isActive: boolean
    _count: {
      Product: number
    }
  }>
  _count: {
    Product: number
  }
}

interface CategoryTreeManagerProps {
  categories: Category[]
}

export function CategoryTreeManager({ categories: initialCategories }: CategoryTreeManagerProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Build tree structure
  const buildTree = (cats: Category[]): any[] => {
    // Remove duplicates by id (keep first occurrence)
    const uniqueCats = Array.from(
      new Map(cats.map((cat) => [cat.id, cat])).values()
    )

    const categoryMap = new Map<string, any>()
    const rootCategories: any[] = []

    // First pass: create map with empty children array
    uniqueCats.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: build tree based on parentId only
    uniqueCats.forEach((cat) => {
      const category = categoryMap.get(cat.id)!

      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!
        // Only add if not already in children
        if (!parent.children.some((child: any) => child.id === cat.id)) {
          parent.children.push(category)
        }
      } else {
        // No parent or parent not found, treat as root
        if (!rootCategories.some((root) => root.id === cat.id)) {
          rootCategories.push(category)
        }
      }
    })

    // Sort root categories
    rootCategories.sort((a, b) => a.sortOrder - b.sortOrder)
    
    // Recursively sort children
    const sortChildren = (category: any) => {
      if (category.children && category.children.length > 0) {
        category.children.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        category.children.forEach(sortChildren)
      }
    }
    rootCategories.forEach(sortChildren)

    return rootCategories
  }

  const filteredCategories = searchQuery
    ? categories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories

  const categoryTree = buildTree(filteredCategories)

  const renderCategory = (category: any, level: number = 0) => {
    // Normalize children to always be an array to avoid runtime errors
    const children = Array.isArray(category.children) ? category.children : []
    const hasChildren = children.length > 0
    const isExpanded = expandedCategories.has(category.id)
    const indent = level * 12
    const productCount = category._count?.Product || category._count?.products || 0
    const canDelete = !hasChildren && productCount === 0

    return (
      <div key={category.id} className={styles.categoryItem}>
        <div
          className={styles.categoryRow}
          style={{ paddingLeft: `${indent + 0.75}rem` }}
        >
          {hasChildren && (
            <button
              className={styles.expandButton}
              onClick={() => toggleExpand(category.id)}
              aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <span className={styles.expandPlaceholder} />}
          <div className={styles.categoryInfo}>
            <div className={styles.categoryMain}>
              <h3 className={styles.categoryName}>{category.name}</h3>
              <span className={styles.categorySlug}>/{category.slug}</span>
            </div>
            <div className={styles.categoryMeta}>
              <span className={styles.productCount}>
                {productCount} товаров
              </span>
              <span
                className={`${styles.status} ${
                  category.isActive ? styles.active : styles.inactive
                }`}
              >
                {category.isActive ? 'Активна' : 'Неактивна'}
              </span>
            </div>
          </div>
          <div className={styles.categoryActions}>
            <Link
              href={`/admin/categories/${category.id}/edit`}
              className={styles.editButton}
            >
              Редактировать
            </Link>
            {canDelete && (
              <button
                className={styles.deleteButton}
                onClick={async () => {
                  if (confirm('Удалить категорию?')) {
                    try {
                      await fetch(`/api/admin/categories/${category.id}`, {
                        method: 'DELETE',
                        credentials: 'include',
                      })
                      router.refresh()
                    } catch (error) {
                      alert('Ошибка при удалении')
                    }
                  }
                }}
              >
                Удалить
              </button>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className={styles.children}>
            {children.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Управление категориями</h1>
          <p className={styles.subtitle}>
            Иерархическая структура категорий и подкатегорий
          </p>
        </div>
        <Link href="/admin/categories/create" className={styles.createButton}>
          + Создать категорию
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <input
            type="text"
            placeholder="Поиск категорий..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button
          className={styles.expandAllButton}
          onClick={() => {
            const allIds = new Set(categories.map((c) => c.id))
            setExpandedCategories(allIds)
          }}
        >
          Развернуть все
        </button>
        <button
          className={styles.collapseAllButton}
          onClick={() => setExpandedCategories(new Set())}
        >
          Свернуть все
        </button>
      </div>

      <div className={styles.tree}>
        {categoryTree.length === 0 ? (
          <div className={styles.empty}>
            <p>Категории не найдены</p>
            <Link href="/admin/categories/create" className={styles.createLink}>
              Создать первую категорию
            </Link>
          </div>
        ) : (
          categoryTree.map((category) => renderCategory(category))
        )}
      </div>
    </div>
  )
}



