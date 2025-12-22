import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './CategoryPreview.module.scss'

type TileSize = 'small' | 'medium' | 'large'

interface FeaturedCategoryTile {
  id: string
  title: string
  url: string
  imageUrl: string
  size: TileSize
}

export function CategoryPreview() {
  const [tiles, setTiles] = useState<FeaturedCategoryTile[]>([])

  useEffect(() => {
    const fetchTiles = async () => {
      try {
        const response = await fetch('/api/featured-categories')
        const data = await response.json()
        if (data.success) {
          setTiles(data.data)
        }
      } catch (error) {
        console.error('Error fetching featured categories:', error)
      }
    }

    fetchTiles()
  }, [])

  if (tiles.length === 0) {
    return null
  }

  return (
    <div className={styles.preview}>
      <div className="container">
        <div className={styles.grid}>
          {tiles.map((tile) => (
            <Link
              key={tile.id}
              href={tile.url}
              className={`${styles.tile} ${styles[tile.size]}`}
              style={{
                backgroundImage: `url(${tile.imageUrl})`,
              }}
            >
              <div className={styles.label}>{tile.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

