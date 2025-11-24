'use client'

import { useState } from 'react'
import styles from './SortBar.module.scss'

type SortBy = 'popularity' | 'name' | 'price' | 'createdAt'
type SortOrder = 'asc' | 'desc'

interface SortBarProps {
  sortBy?: SortBy
  sortOrder?: SortOrder
  onSortChange?: (sortBy: SortBy, sortOrder: SortOrder) => void
}

export function SortBar({ sortBy: externalSortBy, sortOrder: externalSortOrder, onSortChange }: SortBarProps = {}) {
  const [internalSortBy, setInternalSortBy] = useState<SortBy>('popularity')
  const [internalSortOrder, setInternalSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const sortBy = externalSortBy ?? internalSortBy
  const sortOrder = externalSortOrder ?? internalSortOrder

  const handleSort = (newSortBy: SortBy) => {
    let newSortOrder: SortOrder = 'desc'
    
    if (newSortBy === sortBy && newSortBy === 'price') {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    }

    if (onSortChange) {
      onSortChange(newSortBy, newSortOrder)
    } else {
      setInternalSortBy(newSortBy)
      setInternalSortOrder(newSortOrder)
    }
  }

  return (
    <div className={styles.bar}>
      <div className={styles.sort}>
        <span className={styles.label}>Сортировка:</span>
        <button
          className={`${styles.sortButton} ${sortBy === 'popularity' ? styles.active : ''}`}
          onClick={() => handleSort('popularity')}
        >
          По популярности
        </button>
        <button
          className={`${styles.sortButton} ${sortBy === 'name' ? styles.active : ''}`}
          onClick={() => handleSort('name')}
        >
          По алфавиту
        </button>
        <button
          className={`${styles.sortButton} ${sortBy === 'price' ? styles.active : ''}`}
          onClick={() => handleSort('price')}
        >
          По цене {sortBy === 'price' && (sortOrder === 'asc' ? '▲' : '▼')}
        </button>
      </div>
      <div className={styles.view}>
        <button
          className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
          onClick={() => setViewMode('grid')}
          aria-label="Сетка"
        >
          ⬜
        </button>
        <button
          className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
          onClick={() => setViewMode('list')}
          aria-label="Список"
        >
          ☰
        </button>
      </div>
    </div>
  )
}

