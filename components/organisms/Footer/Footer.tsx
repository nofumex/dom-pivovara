'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CallbackModal } from '@/components/molecules/CallbackModal/CallbackModal'
import { useRecentlyViewedStore } from '@/store/recently-viewed-store'
import { formatPrice } from '@/lib/utils'
import styles from './Footer.module.scss'

export function Footer() {
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false)
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const recentIds = useRecentlyViewedStore((state) => state.getRecent(7))

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
  }, [recentIds.join(',')])

  return (
    <>
      <footer className={styles.footer}>
        {/* Секция с логотипами партнеров */}
        <div className={styles.partnersSection}>
          <div className="container">
            <div className={styles.partnersRow}>
              <div className={styles.partnerLogo}>
                <Image
                  src="/images/Ставбондарь.jpg"
                  alt="ВСЕ ДЛЯ ПРИГОТОВЛЕНИЯ СПИРТНЫХ НАПИТКОВ ДОМА"
                  width={120}
                  height={120}
                  className={styles.partnerImage}
                  unoptimized
                />
              </div>
              <div className={styles.partnerLogo}>
                <Image
                  src="/images/Ставбондарь.jpg"
                  alt="Ставбондарь"
                  width={120}
                  height={120}
                  className={styles.partnerImage}
                  unoptimized
                />
              </div>
              <div className={styles.partnerLogo}>
                <Image
                  src="/images/АлтайскийВинокур.jpg"
                  alt="Алтайский винокур"
                  width={120}
                  height={120}
                  className={styles.partnerImage}
                  unoptimized
                />
              </div>
              <div className={styles.partnerLogo}>
                <Image
                  src="/images/ДедАлтай.jpg"
                  alt="ДЕД АЛТАЙ"
                  width={120}
                  height={120}
                  className={styles.partnerImage}
                  unoptimized
                />
              </div>
              <div className={styles.partnerLogo}>
                <Image
                  src="/images/Iplate.jpg"
                  alt="iplate"
                  width={120}
                  height={120}
                  className={styles.partnerImage}
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>

        {/* Секция "Ранее вы смотрели" */}
        <div className={styles.recentlyViewed}>
          <div className="container">
            <h2 className={styles.recentlyViewedTitle}>Ранее вы смотрели</h2>
            <div className={styles.recentlyViewedCarousel}>
              {recentProducts.slice(0, 7).map((product) => {
                const imageUrl = product.images && 
                  product.images.length > 0 && 
                  product.images[0] && 
                  !product.images[0].includes('placeholder')
                  ? product.images[0]
                  : `https://picsum.photos/seed/${product.id}/400/400`

                return (
                  <Link key={product.id} href={`/product/${product.slug}`} className={styles.productCard}>
                    <div
                      className={styles.productImage}
                      style={{
                        backgroundImage: `url(${imageUrl})`,
                      }}
                    />
                    <div className={styles.productName}>{product.title}</div>
                    <div className={styles.productPrice}>
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'decimal',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(typeof product.price === 'string' ? parseFloat(product.price) : product.price)} Р/шт
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Основной футер */}
        <div className={styles.main}>
          <div className="container">
            <div className={styles.footerContent}>
              {/* Колонка 1: Платежные системы и сервисы */}
              <div className={styles.paymentsColumn}>
                <div className={styles.paymentSystems}>
                  <div className={styles.paymentLogo}>VISA</div>
                  <div className={styles.paymentLogo}>МИР</div>
                  <div className={styles.paymentLogo}>TINKOFF</div>
                </div>
                <div className={styles.serviceIcons}>
                  <div className={styles.serviceIcon}>VK</div>
                  <div className={styles.serviceIcon}>Q</div>
                  <div className={styles.serviceIcon}>io</div>
                  <div className={styles.serviceIcon}>✓</div>
                  <div className={styles.serviceIcon}>✗</div>
                  <div className={styles.serviceIcon}>⚙</div>
                </div>
              </div>

              {/* Колонка 2: КОМПАНИЯ */}
              <div className={styles.column}>
                <h3 className={styles.columnTitle}>КОМПАНИЯ</h3>
                <ul className={styles.links}>
                  <li><Link href="/about">О компании</Link></li>
                  <li><Link href="/news">Новости</Link></li>
                  <li><Link href="/stores">Магазины</Link></li>
                </ul>
              </div>

              {/* Колонка 3: ПОМОЩЬ */}
              <div className={styles.column}>
                <h3 className={styles.columnTitle}>ПОМОЩЬ</h3>
                <ul className={styles.links}>
                  <li><Link href="/help">Помощь</Link></li>
                  <li><Link href="/delivery">Условия доставки и оплаты</Link></li>
                </ul>
              </div>

              {/* Колонка 4: ИНФОРМАЦИЯ */}
              <div className={styles.column}>
                <h3 className={styles.columnTitle}>ИНФОРМАЦИЯ</h3>
                <ul className={styles.links}>
                  <li><Link href="/articles">Статьи</Link></li>
                  <li><Link href="/faq">Вопрос-ответ</Link></li>
                </ul>
              </div>

              {/* Колонка 5: Контакты и социальные сети */}
              <div className={styles.contacts}>
                <div className={styles.phoneBlock}>
                  <svg
                    className={styles.phoneIcon}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                      fill="currentColor"
                    />
                  </svg>
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
                <div className={styles.socialIconsMain}>
                  <a href="#" className={`${styles.socialIcon} ${styles.vk}`}>VK</a>
                  <a href="#" className={`${styles.socialIcon} ${styles.youtube}`}>YT</a>
                  <a href="#" className={`${styles.socialIcon} ${styles.telegram}`}>TG</a>
                  <a href="#" className={`${styles.socialIcon} ${styles.viber}`}>VB</a>
                </div>
                <div className={styles.whatsappIcon}>
                  <a href="#" className={`${styles.socialIcon} ${styles.whatsapp}`}>WA</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя строка с копирайтом */}
        <div className={styles.bottom}>
          <div className="container">
            <p className={styles.copyright}>
              Разработка сайтов на 1С-Битрикс - KONTUR
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

