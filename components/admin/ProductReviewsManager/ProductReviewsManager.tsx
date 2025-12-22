'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import styles from './ProductReviewsManager.module.scss'

interface Review {
  id: string
  rating: number
  title: string | null
  content: string
  isActive: boolean
  createdAt: string
  User: {
    firstName: string
    lastName: string
    email: string
  }
}

interface ProductReviewsManagerProps {
  productSlug: string
  initialReviews?: Review[]
}

export function ProductReviewsManager({ productSlug, initialReviews = [] }: ProductReviewsManagerProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [productSlug])

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productSlug}/reviews`, {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        setReviews(data.data)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const handleToggleReview = async (reviewId: string, isActive: boolean) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/products/${productSlug}/reviews`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewId, isActive: !isActive }),
      })
      const data = await response.json()
      if (data.success) {
        setReviews(reviews.map((r) => (r.id === reviewId ? { ...r, isActive: !isActive } : r)))
      } else {
        alert(data.error || 'Ошибка при обновлении отзыва')
      }
    } catch (error) {
      console.error('Error updating review:', error)
      alert('Ошибка при обновлении отзыва')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв? Это действие нельзя отменить.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/products/${productSlug}/reviews`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewId }),
      })
      const data = await response.json()
      if (data.success) {
        setReviews(reviews.filter((r) => r.id !== reviewId))
        alert('Отзыв удален успешно')
      } else {
        alert(data.error || 'Ошибка при удалении отзыва')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Ошибка при удалении отзыва')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.reviewsManager}>
      <h3 className={styles.title}>Управление отзывами ({reviews.length})</h3>
      {reviews.length === 0 ? (
        <p className={styles.empty}>Отзывов пока нет</p>
      ) : (
        <div className={styles.reviewsList}>
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`${styles.review} ${review.isActive ? styles.active : styles.inactive}`}
            >
              <div className={styles.reviewHeader}>
                <div className={styles.reviewUser}>
                  <strong>
                    {review.User.firstName} {review.User.lastName}
                  </strong>
                  <span className={styles.reviewEmail}>{review.User.email}</span>
                </div>
                <div className={styles.reviewMeta}>
                  <span className={styles.reviewRating}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                  <span className={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                  <span className={`${styles.reviewStatus} ${review.isActive ? styles.approved : styles.pending}`}>
                    {review.isActive ? 'Одобрен' : 'Ожидает модерации'}
                  </span>
                </div>
              </div>
              {review.title && <h4 className={styles.reviewTitle}>{review.title}</h4>}
              <p className={styles.reviewContent}>{review.content}</p>
              <div className={styles.reviewActions}>
                <Button
                  variant={review.isActive ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => handleToggleReview(review.id, review.isActive)}
                  disabled={loading}
                >
                  {review.isActive ? 'Отклонить' : 'Одобрить'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteReview(review.id)}
                  disabled={loading}
                  className={styles.deleteButton}
                >
                  Удалить
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

