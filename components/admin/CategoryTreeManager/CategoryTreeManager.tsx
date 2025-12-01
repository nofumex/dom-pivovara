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
    const categoryMap = new Map<string, any>()
    const rootCategories: any[] = []

    // First pass: create map with children array
    cats.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: cat.other_Category || [] })
    })

    // Second pass: build tree
    cats.forEach((cat) => {
      const category = categoryMap.get(cat.id)!
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(category)
        } else {
          rootCategories.push(category)
        }
      } else {
        rootCategories.push(category)
      }
    })

    return rootCategories.sort((a, b) => a.sortOrder - b.sortOrder)
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
    const hasChildren = (category.children && category.children.length > 0) || (category.other_Category && category.other_Category.length > 0)
    const isExpanded = expandedCategories.has(category.id)
    const indent = level * 24
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
            {category.children
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((child) => {
                const fullChild = categories.find((c) => c.id === child.id)
                return fullChild ? renderCategory(fullChild, level + 1) : null
              })}
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



