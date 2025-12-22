 'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './CategoryBanners.module.scss'

type TileSize = 'small' | 'medium' | 'large'

interface FeaturedCategoryTile {
  id: string
  title: string
  url: string
  imageUrl: string
  size: TileSize
}

export function CategoryBanners() {
  const [tiles, setTiles] = useState<FeaturedCategoryTile[]>([])

  useEffect(() => {
    const fetchTiles = async () => {
      try {
        const response = await fetch('/api/featured-categories')
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setTiles(data.data)
        }
      } catch (error) {
        console.error('Error fetching featured categories for homepage:', error)
      }
    }

    fetchTiles()
  }, [])

  if (tiles.length === 0) {
    return null
  }

  const visibleTiles = tiles.slice(0, 6)

  return (
    <div className={styles.banners}>
      <div className={styles.grid}>
        {visibleTiles.map((tile) => (
          <Link
            key={tile.id}
            href={tile.url}
            className={styles.banner}
          >
            <div className={styles.imageWrapper}>
              <img
                src={tile.imageUrl}
                alt={tile.title}
                className={styles.image}
                loading="lazy"
              />
              <div className={styles.overlay} />
            </div>
            <div className={styles.title}>{tile.title}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
