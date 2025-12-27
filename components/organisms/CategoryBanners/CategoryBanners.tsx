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
        const response = await fetch('/api/featured-categories', { 
          cache: 'no-store'
        })
        
        if (!response.ok) {
          console.error('[CategoryBanners] API request failed:', response.status, response.statusText)
          return
        }
        
        const data = await response.json()
        
        if (data.success && Array.isArray(data.data)) {
          console.log(`[CategoryBanners] Loaded ${data.data.length} category tiles`)
          setTiles(data.data)
        } else {
          console.warn('[CategoryBanners] Unexpected API response format:', data)
        }
      } catch (error) {
        console.error('[CategoryBanners] Error fetching featured categories:', error)
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
