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
      <div className={styles.priceFilter}>
        <label className={styles.label}>Цена</label>
        <div className={styles.priceDisplay}>
          {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}
        </div>
        <div className={styles.priceInputs}>
          <input
            type="number"
            placeholder="От"
            value={priceMin}
            onChange={handlePriceMinChange}
            className={styles.priceInput}
          />
          <span>—</span>
          <input
            type="number"
            placeholder="До"
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

      <div className={styles.checkboxes}>
        <div className={styles.sectionTitle}>Наши предложения</div>
        <Checkbox
          label="По акции (1)"
          checked={onSale}
          onChange={(e) => setOnSale(e.target.checked)}
        />
      </div>

      <div className={styles.actions}>
        <Button variant="primary" size="sm" onClick={handleApply}>
          Показать
        </Button>
        <Button variant="link" size="sm" onClick={handleReset}>
          Сбросить
        </Button>
      </div>
    </div>
  )
}

