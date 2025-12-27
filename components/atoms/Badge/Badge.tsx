'use client'

import React from 'react'
import styles from './Badge.module.scss'

interface BadgeProps {
  type: 'hit' | 'new' | 'sale'
  children?: React.ReactNode
}

const badgeLabels = {
  hit: 'Хиты продаж',
  new: 'Новинка',
  sale: 'По акции',
}

export const Badge: React.FC<BadgeProps> = ({ type, children }) => {
  return (
    <span className={`${styles.badge} ${styles[type]}`}>
      {children || badgeLabels[type]}
    </span>
  )
}


























