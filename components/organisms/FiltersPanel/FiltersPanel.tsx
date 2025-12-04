'use client'

import { useState } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import { Checkbox } from '@/components/atoms/Checkbox/Checkbox'
import { Range } from '@/components/atoms/Range/Range'
import { formatPrice } from '@/lib/utils'
import styles from './FiltersPanel.module.scss'

interface FiltersPanelProps {
  onFilterChange?: (filters: {
    priceMin: number
    priceMax: number
    onSale: boolean
  }) => void
}

export function FiltersPanel({ onFilterChange }: FiltersPanelProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [onSale, setOnSale] = useState(false)

  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceRange(value)
    setPriceMin(value[0].toString())
    setPriceMax(value[1].toString())
  }

  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setPriceMin(e.target.value)
    if (value <= priceRange[1]) {
      setPriceRange([value, priceRange[1]])
    }
  }

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 100000
    setPriceMax(e.target.value)
    if (value >= priceRange[0]) {
      setPriceRange([priceRange[0], value])
    }
  }

  const handleApply = () => {
    if (onFilterChange) {
      onFilterChange({
        priceMin: priceRange[0],
        priceMax: priceRange[1],
        onSale,
      })
    }
  }

  const handleReset = () => {
    setPriceRange([0, 100000])
    setPriceMin('')
    setPriceMax('')
    setOnSale(false)
    if (onFilterChange) {
      onFilterChange({
        priceMin: 0,
        priceMax: 100000,
        onSale: false,
      })
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.priceRow}>
        <span className={styles.label}>Цена</span>
        <div className={styles.priceInputs}>
          <input
            type="number"
            placeholder="40"
            value={priceMin}
            onChange={handlePriceMinChange}
            className={styles.priceInput}
          />
          <span className={styles.dash}>—</span>
          <input
            type="number"
            placeholder="7225"
            value={priceMax}
            onChange={handlePriceMaxChange}
            className={styles.priceInput}
          />
        </div>
        <div className={styles.priceRange}>
          <Range
            min={0}
            max={100000}
            value={priceRange}
            onChange={handlePriceRangeChange}
            step={100}
            formatValue={(v) => formatPrice(v)}
          />
        </div>
      </div>

      <div className={styles.actionsRow}>
        <Button variant="primary" size="sm" onClick={handleApply}>
          Показать
        </Button>
        <button type="button" className={styles.resetButton} onClick={handleReset}>
          × Сбросить
        </button>
      </div>
    </div>
  )
}

