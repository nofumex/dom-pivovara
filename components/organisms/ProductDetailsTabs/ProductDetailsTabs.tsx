'use client'

import { useState } from 'react'
import styles from './ProductDetailsTabs.module.scss'

interface ProductDetailsTabsProps {
  product: {
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
              <p>Пока нет отзывов</p>
            )}
          </div>
        )}

        {activeTab === 'question' && (
          <div className={styles.content}>
            <form className={styles.questionForm}>
              <input type="text" placeholder="Имя" className={styles.formInput} />
              <input type="text" placeholder="Телефон или email" className={styles.formInput} />
              <textarea
                placeholder="Ваш вопрос"
                className={styles.formTextarea}
                rows={5}
              />
              <label className={styles.checkboxLabel}>
                <input type="checkbox" required />
                <span>Согласен на обработку персональных данных</span>
              </label>
              <button type="submit" className={styles.submitButton}>
                Отправить
              </button>
            </form>
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

