'use client'

import Link from 'next/link'
import styles from './DashboardStats.module.scss'

interface Stats {
  totalUsers: number
  totalOrders: number
  totalProducts: number
  totalRevenue: number
  newUsersToday: number
  newOrdersToday: number
}

interface DashboardStatsProps {
  stats: Stats
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Всего пользователей',
      value: stats.totalUsers,
      change: `+${stats.newUsersToday} сегодня`,
      link: '/admin/customers',
      icon: '👥',
      color: '#3b82f6',
    },
    {
      title: 'Всего заказов',
      value: stats.totalOrders,
      change: `+${stats.newOrdersToday} сегодня`,
      link: '/admin/orders',
      icon: '🛒',
      color: '#10b981',
    },
    {
      title: 'Товаров',
      value: stats.totalProducts,
      change: 'Активных',
      link: '/admin/products',
      icon: '📦',
      color: '#f59e0b',
    },
    {
      title: 'Выручка',
      value: new Intl.NumberFormat('ru-RU').format(stats.totalRevenue),
      change: 'Всего',
      link: '/admin/analytics',
      icon: '💰',
      color: '#8b5cf6',
      suffix: ' ₽',
    },
  ]

  return (
    <div className={styles.stats}>
      {statCards.map((card, index) => (
        <Link key={index} href={card.link} className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: `${card.color}15`, color: card.color }}>
            <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
          </div>
          <div className={styles.statContent}>
            <p className={styles.statTitle}>{card.title}</p>
            <p className={styles.statValue}>
              {card.value}
              {card.suffix}
            </p>
            <p className={styles.statChange}>{card.change}</p>
          </div>
          <div className={styles.statArrow}>→</div>
        </Link>
      ))}
    </div>
  )
}

