'use client'

import { useState } from 'react'
import styles from './SortBar.module.scss'

type SortBy = 'popularity' | 'name' | 'price' | 'createdAt'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

interface SortBarProps {
  sortBy?: SortBy
  sortOrder?: SortOrder
  viewMode?: ViewMode
  onSortChange?: (sortBy: SortBy, sortOrder: SortOrder) => void
  onViewModeChange?: (viewMode: ViewMode) => void
}

export function SortBar({ sortBy: externalSortBy, sortOrder: externalSortOrder, viewMode: externalViewMode, onSortChange, onViewModeChange }: SortBarProps = {}) {
  const [internalSortBy, setInternalSortBy] = useState<SortBy>('popularity')
  const [internalSortOrder, setInternalSortOrder] = useState<SortOrder>('desc')
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('grid')
  
  const viewMode = externalViewMode ?? internalViewMode

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
          onClick={() => {
            const newMode: ViewMode = 'grid'
            if (onViewModeChange) {
              onViewModeChange(newMode)
            } else {
              setInternalViewMode(newMode)
            }
          }}
          aria-label="Сетка"
          title="Сетка"
        >
          ⬜
        </button>
        <button
          className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
          onClick={() => {
            const newMode: ViewMode = 'list'
            if (onViewModeChange) {
              onViewModeChange(newMode)
            } else {
              setInternalViewMode(newMode)
            }
          }}
          aria-label="Список"
          title="Список"
        >
          ☰
        </button>
      </div>
    </div>
  )
}

