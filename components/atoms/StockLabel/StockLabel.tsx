'use client'

import styles from './StockLabel.module.scss'

type StockStatus = 'many' | 'enough' | 'few' | 'none'

interface StockLabelProps {
  stock: StockStatus
  size?: 'sm' | 'md'
}

const stockConfig: Record<StockStatus, { text: string; icon: string; color: string }> = {
  many: {
    text: 'Много',
    icon: '✓',
    color: 'var(--color-success)',
  },
  enough: {
    text: 'Достаточно',
    icon: '✓',
    color: 'var(--color-success)',
  },
  few: {
    text: 'Мало',
    icon: '⚠',
    color: 'var(--color-warning)',
  },
  none: {
    text: 'Нет в наличии',
    icon: '✗',
    color: '#9E9E9E',
  },
}

export function StockLabel({ stock, size = 'md' }: StockLabelProps) {
  const config = stockConfig[stock] || stockConfig.enough

  return (
    <div className={`${styles.stockLabel} ${styles[stock]} ${styles[size]}`}>
      <span className={styles.icon} style={{ color: config.color }}>
        {config.icon}
      </span>
      <span className={styles.text} style={{ color: config.color }}>
        {config.text}
      </span>
    </div>
  )
}





















