'use client'

import { useState } from 'react'
import styles from './ProductDetailsTabs.module.scss'

interface ProductDetailsTabsProps {
  product: {
    id?: string
    slug?: string
    description?: string
    content?: string
    reviews?: any[]
    sku?: string
    weight?: number
    dimensions?: string
    material?: string
    [key: string]: any
  }
}

export function ProductDetailsTabs({ product }: ProductDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'question' | 'additional'>('description')
  const [questionForm, setQuestionForm] = useState({
    name: '',
    contact: '',
    question: '',
    agree: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [questionSubmitted, setQuestionSubmitted] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: '',
  })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  return (
    <div className={styles.tabs}>
      <div className={styles.tabButtons}>
        <button
          className={`${styles.tabButton} ${activeTab === 'description' ? styles.active : ''}`}
          onClick={() => setActiveTab('description')}
        >
          Описание
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'reviews' ? styles.active : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Отзывы
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'question' ? styles.active : ''}`}
          onClick={() => setActiveTab('question')}
        >
          Задать вопрос
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'additional' ? styles.active : ''}`}
          onClick={() => setActiveTab('additional')}
        >
          Дополнительно
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'description' && (
          <div 
            className={styles.content}
            dangerouslySetInnerHTML={{ 
              __html: product.description || product.content || 'Описание товара отсутствует.' 
            }}
          />
        )}

        {activeTab === 'reviews' && (
          <div className={styles.content}>
            {!showReviewForm && !reviewSubmitted && (
              <div className={styles.reviewFormHeader}>
                <h3 className={styles.reviewFormTitle}>Оставить отзыв</h3>
                <button
                  className={styles.addReviewButton}
                  onClick={() => setShowReviewForm(true)}
                >
                  Написать отзыв
                </button>
              </div>
            )}

            {showReviewForm && !reviewSubmitted && (
              <form
                className={styles.reviewForm}
                onSubmit={async (e) => {
                  e.preventDefault()
                  setIsSubmittingReview(true)
                  try {
                    // Очищаем пустой заголовок перед отправкой
                    const reviewData = {
                      productId: product.id,
                      rating: reviewForm.rating,
                      title: reviewForm.title?.trim() || undefined,
                      content: reviewForm.content.trim(),
                    }

                    const response = await fetch('/api/reviews', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify(reviewData),
                    })
                    const data = await response.json()
                    if (data.success) {
                      setReviewSubmitted(true)
                      setShowReviewForm(false)
                      setReviewForm({ rating: 5, title: '', content: '' })
                      alert('Спасибо за ваш отзыв! Он будет опубликован после модерации.')
                    } else {
                      // Показываем более понятное сообщение об ошибке
                      let errorMessage = 'Ошибка при отправке отзыва'
                      if (data.error) {
                        if (data.error.includes('10 символов')) {
                          errorMessage = 'Отзыв должен содержать минимум 10 символов. Пожалуйста, опишите ваш опыт более подробно.'
                        } else if (data.error.includes('авторизация') || data.error.includes('401')) {
                          errorMessage = 'Для оставления отзыва необходимо войти в систему. Пожалуйста, авторизуйтесь.'
                        } else if (data.error.includes('уже оставляли')) {
                          errorMessage = 'Вы уже оставляли отзыв на этот товар. Один пользователь может оставить только один отзыв.'
                        } else {
                          errorMessage = data.error
                        }
                      }
                      alert(errorMessage)
                    }
                  } catch (error) {
                    console.error('Error submitting review:', error)
                    alert('Ошибка при отправке отзыва. Пожалуйста, проверьте подключение к интернету и попробуйте снова.')
                  } finally {
                    setIsSubmittingReview(false)
                  }
                }}
              >
                <div className={styles.reviewFormRow}>
                  <label className={styles.reviewFormLabel}>Оценка *</label>
                  <div className={styles.ratingSelector}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`${styles.ratingStar} ${reviewForm.rating >= star ? styles.active : ''}`}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.reviewFormRow}>
                  <label className={styles.reviewFormLabel}>Заголовок (необязательно)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    placeholder="Краткий заголовок отзыва"
                  />
                </div>
                <div className={styles.reviewFormRow}>
                  <label className={styles.reviewFormLabel}>Отзыв *</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={6}
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                    placeholder="Расскажите о вашем опыте использования товара"
                    required
                  />
                </div>
                <div className={styles.reviewFormActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowReviewForm(false)
                      setReviewForm({ rating: 5, title: '', content: '' })
                    }}
                  >
                    Отмена
                  </button>
                  <button type="submit" className={styles.submitButton} disabled={isSubmittingReview}>
                    {isSubmittingReview ? 'Отправка...' : 'Отправить отзыв'}
                  </button>
                </div>
              </form>
            )}

            {reviewSubmitted && (
              <div className={styles.successMessage}>
                <p>✅ Ваш отзыв отправлен на модерацию! Он будет опубликован после проверки администратором.</p>
              </div>
            )}

            <div className={styles.reviewsSection}>
              <h3 className={styles.reviewsSectionTitle}>Отзывы покупателей</h3>
              {Array.isArray(product.reviews) && product.reviews.length > 0 ? (
                <div className={styles.reviews}>
                  {product.reviews.map((review: any) => (
                    <div key={review.id} className={styles.review}>
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewAuthor}>
                          {review.user?.firstName || ''} {review.user?.lastName || ''}
                        </span>
                        <span className={styles.reviewRating}>
                          {'★'.repeat(review.rating || 0)}
                        </span>
                        <span className={styles.reviewDate}>
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('ru-RU') : ''}
                        </span>
                      </div>
                      {review.title && <h4 className={styles.reviewTitle}>{review.title}</h4>}
                      <p className={styles.reviewContent}>{review.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noReviews}>Пока нет отзывов. Будьте первым!</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'question' && (
          <div className={styles.content}>
            {questionSubmitted ? (
              <div className={styles.successMessage}>
                <p>✅ Ваш вопрос отправлен! Мы свяжемся с вами в ближайшее время.</p>
              </div>
            ) : (
              <form 
                className={styles.questionForm}
                onSubmit={async (e) => {
                  e.preventDefault()
                  setIsSubmitting(true)
                  try {
                    const response = await fetch('/api/leads', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: questionForm.name,
                        phone: questionForm.contact,
                        email: questionForm.contact.includes('@') ? questionForm.contact : undefined,
                        message: `Вопрос о товаре: ${product.slug || product.id}\n\n${questionForm.question}`,
                        source: 'QUESTION',
                        productId: product.id,
                      }),
                    })
                    if (response.ok) {
                      setQuestionSubmitted(true)
                      setQuestionForm({ name: '', contact: '', question: '', agree: false })
                    } else {
                      alert('Ошибка при отправке вопроса')
                    }
                  } catch (error) {
                    console.error('Error submitting question:', error)
                    alert('Ошибка при отправке вопроса')
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
              >
                <input 
                  type="text" 
                  placeholder="Имя" 
                  className={styles.formInput}
                  value={questionForm.name}
                  onChange={(e) => setQuestionForm({ ...questionForm, name: e.target.value })}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Телефон или email" 
                  className={styles.formInput}
                  value={questionForm.contact}
                  onChange={(e) => setQuestionForm({ ...questionForm, contact: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Ваш вопрос"
                  className={styles.formTextarea}
                  rows={5}
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  required
                />
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    required
                    checked={questionForm.agree}
                    onChange={(e) => setQuestionForm({ ...questionForm, agree: e.target.checked })}
                  />
                  <span>Согласен на обработку персональных данных</span>
                </label>
                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                  {isSubmitting ? 'Отправка...' : 'Отправить'}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'additional' && (
          <div className={styles.content}>
            <table className={styles.specsTable}>
              <tbody>
                <tr>
                  <td>Артикул</td>
                  <td>{product.sku}</td>
                </tr>
                {product.weight && (
                  <tr>
                    <td>Вес</td>
                    <td>{product.weight} кг</td>
                  </tr>
                )}
                {product.dimensions && (
                  <tr>
                    <td>Размеры</td>
                    <td>{product.dimensions}</td>
                  </tr>
                )}
                {product.material && (
                  <tr>
                    <td>Материал</td>
                    <td>{product.material}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

