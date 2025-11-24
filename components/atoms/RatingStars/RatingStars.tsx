'use client'

import styles from './RatingStars.module.scss'

interface RatingStarsProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function RatingStars({ rating, size = 'md', showText = true }: RatingStarsProps) {
  // Округляем до ближайшего 0.5
  const roundedRating = Math.round(rating * 2) / 2
  const fullStars = Math.floor(roundedRating)
  const hasHalfStar = roundedRating % 1 !== 0

  return (
    <div className={styles.rating}>
      <div className={styles.stars}>
        {[0, 1, 2, 3, 4].map((index) => {
          const isFull = index < fullStars
          const isHalf = index === fullStars && hasHalfStar

          return (
            <svg
              key={index}
              className={`${styles.star} ${styles[size]}`}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`star-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop
                    offset={isFull ? '100%' : isHalf ? '50%' : '0%'}
                    stopColor="var(--color-star)"
                  />
                  <stop
                    offset={isFull ? '100%' : isHalf ? '50%' : '0%'}
                    stopColor="var(--color-border)"
                  />
                </linearGradient>
              </defs>
              <path
                d="M8 0L10.163 5.528L16 6.112L12 10.056L12.944 16L8 13.056L3.056 16L4 10.056L0 6.112L5.837 5.528L8 0Z"
                fill={isFull ? 'var(--color-star)' : isHalf ? 'url(#star-gradient-' + index + ')' : 'none'}
                stroke="var(--color-border)"
                strokeWidth="1"
              />
            </svg>
          )
        })}
      </div>
      {showText && (
        <span className={styles.text}>
          {rating > 0 ? rating.toFixed(1) : 'Нет отзывов'}
        </span>
      )}
    </div>
  )
}

