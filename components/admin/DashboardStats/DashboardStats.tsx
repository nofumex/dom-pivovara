'use client'

import Link from 'next/link'
import styles from './DashboardStats.module.scss'

// SVG Icons
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const ShoppingCartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)

const PackageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)

const DollarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

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
      icon: UsersIcon,
      color: '#f97316',
    },
    {
      title: 'Всего заказов',
      value: stats.totalOrders,
      change: `+${stats.newOrdersToday} сегодня`,
      link: '/admin/orders',
      icon: ShoppingCartIcon,
      color: '#10b981',
    },
    {
      title: 'Товаров',
      value: stats.totalProducts,
      change: 'Активных',
      link: '/admin/products',
      icon: PackageIcon,
      color: '#f59e0b',
    },
    {
      title: 'Выручка',
      value: new Intl.NumberFormat('ru-RU').format(stats.totalRevenue),
      change: 'Всего',
      link: '/admin/analytics',
      icon: DollarIcon,
      color: '#8b5cf6',
      suffix: ' ₽',
    },
  ]

  return (
    <div className={styles.stats}>
      {statCards.map((card, index) => (
        <Link key={index} href={card.link} className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: `${card.color}15`, color: card.color }}>
            <card.icon />
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























