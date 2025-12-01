'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CallbackModal } from '@/components/molecules/CallbackModal/CallbackModal'
import { useRecentlyViewedStore } from '@/store/recently-viewed-store'
import styles from './Footer.module.scss'

export function Footer() {
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false)
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const recentIds = useRecentlyViewedStore((state) => state.getRecent(6))

  useEffect(() => {
    const loadRecentProducts = async () => {
      if (recentIds.length === 0) {
        setRecentProducts([])
        return
      }

      try {
        const response = await fetch('/api/products/by-ids', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: recentIds }),
        })

        const data = await response.json()
        if (data.success && data.data) {
          setRecentProducts(data.data)
        }
      } catch (error) {
        console.error('Error loading recent products:', error)
        setRecentProducts([])
      }
    }

    loadRecentProducts()
  }, [recentIds.join(',')]) // Обновляем при изменении списка ID

  // Всегда показываем 6 слотов
  const slots = Array.from({ length: 6 }, (_, i) => {
    return recentProducts[i] || null
  })

  return (
    <>
    <footer className={styles.footer}>
      <div className={styles.recentlyViewed}>
        <div className="container">
          <h2 className={styles.recentlyViewedTitle}>Вы недавно смотрели</h2>
          <div className={styles.recentlyViewedGrid}>
            {slots.map((product, index) => (
              <div key={product?.id || `empty-${index}`} className={styles.recentProductSlot}>
                {product ? (
                  <Link href={`/product/${product.slug}`} className={styles.productLink}>
                    <div
                      className={styles.productImagePlaceholder}
                      style={{
                        backgroundImage: (() => {
                          // Проверяем, есть ли реальное изображение
                          const hasRealImage = product.images && 
                            product.images.length > 0 && 
                            product.images[0] && 
                            !product.images[0].includes('placeholder')
                          
                          if (hasRealImage) {
                            return `url(${product.images[0]})`
                          }
                          // Используем picsum.photos как fallback
                          return `url(https://picsum.photos/seed/${product.id}/400/400)`
                        })(),
                      }}
                    />
                  </Link>
                ) : (
                  <div className={styles.emptySlot}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.main}>
        <div className="container">
          <div className={styles.content}>
            <div className={styles.payments}>
              <div className={styles.paymentIcon}>VISA</div>
              <div className={styles.paymentIcon}>МИР</div>
              <div className={styles.paymentIcon}>Tinkoff</div>
            </div>

            <div className={styles.columns}>
              <div className={styles.column}>
                <h3 className={styles.columnTitle}>КОМПАНИЯ</h3>
                <ul className={styles.links}>
                  <li><Link href="/about">О компании</Link></li>
                  <li><Link href="/news">Новости</Link></li>
                  <li><Link href="/stores">Магазины</Link></li>
                </ul>
              </div>

              <div className={styles.column}>
                <h3 className={styles.columnTitle}>ПОМОЩЬ</h3>
                <ul className={styles.links}>
                  <li><Link href="/help">Помощь</Link></li>
                  <li><Link href="/delivery">Условия доставки и оплаты</Link></li>
                </ul>
              </div>

              <div className={styles.column}>
                <h3 className={styles.columnTitle}>ИНФОРМАЦИЯ</h3>
                <ul className={styles.links}>
                  <li><Link href="/articles">Статьи</Link></li>
                  <li><Link href="/faq">Вопрос‑ответ</Link></li>
                </ul>
              </div>

              <div className={styles.contacts}>
                <div className={styles.phoneBlock}>
                  <div className={styles.phoneIcon}></div>
                  <div className={styles.phoneNumbers}>
                    <div>+7 913 555-222-6</div>
                    <div>+7 913 037-32-47</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsCallbackModalOpen(true)}
                  className={styles.callbackLink}
                >
                  ЗАКАЗАТЬ ЗВОНОК
                </button>
                <p className={styles.socialText}>Мы в социальных сетях:</p>
                <div className={styles.socialIcons}>
                  <a href="#" className={`${styles.socialIcon} ${styles.vk}`}>VK</a>
                  <a href="#" className={`${styles.socialIcon} ${styles.youtube}`}>YT</a>
                  <a href="#" className={`${styles.socialIcon} ${styles.telegram}`}>TG</a>
                  <a href="#" className={`${styles.socialIcon} ${styles.whatsapp}`}>WA</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <p className={styles.copyright}>
            Разработка сайтов на 1С‑Битрикс — <Link href="#">KONTUR</Link>
          </p>
        </div>
      </div>
    </footer>

    <CallbackModal
      isOpen={isCallbackModalOpen}
      onClose={() => setIsCallbackModalOpen(false)}
    />
    </>
  )
}

