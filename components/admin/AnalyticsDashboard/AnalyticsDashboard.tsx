'use client'

import { useState } from 'react'
import styles from './AnalyticsDashboard.module.scss'

interface Analytics {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  newUsers: number
  newOrders: number
  recentOrders: any[]
  topProducts: any[]
  orderStatsByStatus: Record<string, number>
  ordersByDate: Array<{
    date: string
    total: number
    status: string
  }>
}

interface AnalyticsDashboardProps {
  analytics: Analytics
}

export function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  const stats = [
    {
      title: 'Всего пользователей',
      value: analytics.totalUsers,
      change: `+${analytics.newUsers} за неделю`,
      color: '#3b82f6',
    },
    {
      title: 'Всего заказов',
      value: analytics.totalOrders,
      change: `+${analytics.newOrders} за неделю`,
      color: '#10b981',
    },
    {
      title: 'Выручка',
      value: new Intl.NumberFormat('ru-RU').format(analytics.totalRevenue),
      change: 'Всего',
      color: '#8b5cf6',
      suffix: ' ₽',
    },
    {
      title: 'Товаров',
      value: analytics.totalProducts,
      change: 'Активных',
      color: '#f59e0b',
    },
  ]

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Аналитика</h1>
          <p className={styles.subtitle}>Статистика и аналитика магазина</p>
        </div>
        <div className={styles.periodSelector}>
          {(['7d', '30d', '90d', '1y'] as const).map((p) => (
            <button
              key={p}
              className={`${styles.periodButton} ${period === p ? styles.active : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === '7d' && '7 дней'}
              {p === '30d' && '30 дней'}
              {p === '90d' && '90 дней'}
              {p === '1y' && 'Год'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.stats}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
            </div>
            <div className={styles.statContent}>
              <p className={styles.statTitle}>{stat.title}</p>
              <p className={styles.statValue}>
                {stat.value}
                {stat.suffix}
              </p>
              <p className={styles.statChange}>{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.charts}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Статистика заказов по статусам</h2>
          <div className={styles.statusChart}>
            {Object.entries(analytics.orderStatsByStatus).map(([status, count]) => {
              const total = Object.values(analytics.orderStatsByStatus).reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? (count / total) * 100 : 0
              const statusLabels: Record<string, string> = {
                NEW: 'Новые',
                PROCESSING: 'В обработке',
                SHIPPED: 'Отгружены',
                DELIVERED: 'Доставлены',
                CANCELLED: 'Отменены',
              }
              return (
                <div key={status} className={styles.statusBar}>
                  <div className={styles.statusBarHeader}>
                    <span className={styles.statusLabel}>{statusLabels[status] || status}</span>
                    <span className={styles.statusCount}>{count}</span>
                  </div>
                  <div className={styles.statusBarTrack}>
                    <div
                      className={styles.statusBarFill}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Топ товары</h2>
          <div className={styles.topProducts}>
            {analytics.topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className={styles.topProductItem}>
                <span className={styles.productRank}>#{index + 1}</span>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.title}</h3>
                  <p className={styles.productSold}>Продано: {product.totalSold} шт.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

