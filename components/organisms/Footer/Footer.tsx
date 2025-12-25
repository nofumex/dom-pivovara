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
      {slots.some((product) => product) && (
        <div className={styles.recentlyViewed}>
          <div className="container">
            <h2 className={styles.recentlyViewedTitle}>Ранее вы смотрели</h2>
            <div className={styles.recentlyViewedGrid}>
              {slots.map((product, index) => (
                <div key={product?.id || `empty-${index}`} className={styles.recentProductSlot}>
                  {product ? (
                    <Link href={`/product/${product.slug}`} className={styles.productCard}>
                      <div
                        className={styles.productThumb}
                        style={{
                          backgroundImage: (() => {
                            const hasRealImage =
                              product.images &&
                              product.images.length > 0 &&
                              product.images[0] &&
                              !product.images[0].includes('placeholder')

                            if (hasRealImage) {
                              return `url(${product.images[0]})`
                            }

                            return `url(https://picsum.photos/seed/${product.id}/400/400)`
                          })(),
                        }}
                      />
                      <div className={styles.productInfo}>
                        <div className={styles.productTitle}>{product.title}</div>
                        <div className={styles.productPrice}>{formatPrice(product.price)}</div>
                      </div>
                    </Link>
                  ) : (
                    <div className={styles.emptySlot}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.main}>
        <div className="container">
          <div className={styles.content}>
            <div className={styles.logoSection}>
              <div className={styles.logoWrapper}>
                <Image
                  src="/images/logoPivovar.png"
                  alt="Дом Пивовара"
                  width={80}
                  height={80}
                  className={styles.logo}
                />
              </div>
              <p className={styles.logoDescription}>
                Дом Пивовара — всё для домашнего пива, виноделия и дистилляции.
                Подберём оборудование, ингредиенты и аксессуары, чтобы ваш напиток получался идеальным каждый раз.
              </p>
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
                  <div className={styles.phoneIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
                    </svg>
                  </div>
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
                  <a
                    href="https://vk.com/dompivovar_ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.socialIcon} ${styles.vk}`}
                    aria-label="ВКонтакте"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M4.5 6.5c.12 6.06 3.15 9.63 8.45 9.63h.3v-3.1c1.97.2 3.47 1.65 4.08 3.1h2.77c-.75-2.15-2.22-3.55-3.38-4.1 1.16-.67 2.8-2.29 3.19-5h-2.53c-.56 1.99-2.2 3.61-3.75 3.78V6.5h-2.5v6.84c-1.56-.4-3.48-2.16-3.56-6.84H4.5Z"
                        fill="white"
                      />
                    </svg>
                  </a>
                  <a
                    href="https://t.me/dompivovar_shop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.socialIcon} ${styles.telegram}`}
                    aria-label="Telegram"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.174 1.857-.928 6.678-1.309 8.855-.177.998-.525 1.332-.86 1.365-.73.064-1.283-.482-1.99-.945-1.103-.73-1.727-1.184-2.797-1.897-1.21-.9-.425-1.395.263-2.203.18-.21 3.256-2.988 3.317-3.243.007-.032.014-.15-.056-.212-.07-.062-.173-.041-.248-.024-.106.024-1.793 1.14-5.062 3.345-.479.336-.913.5-1.304.491-.43-.01-1.256-.242-1.87-.442-.755-.248-1.354-.38-1.303-.803.027-.22.325-.445.895-.675 3.498-1.524 5.83-2.529 7.002-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.024.465.14.118.095.151.223.167.312.016.09.036.297.02.458z" fill="white"/>
                    </svg>
                  </a>
                  <a
                    href="https://api.whatsapp.com/send/?phone=89135552226&text&type=phone_number&app_absent=0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.socialIcon} ${styles.whatsapp}`}
                    aria-label="WhatsApp"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="white"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomContent}>
          <a
            href="https://casadigital.ru/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.developerBadge}
            aria-label="Сайт разработан агентством Casa Digital"
          >
            <span className={styles.devIcon}>
              <Image
                src="/images/logo.png"
                alt="Casa Digital"
                width={24}
                height={24}
              />
            </span>
            <span className={styles.devText}>Сайт разработан агентством</span>
            <span className={styles.devBrand}>Casa Digital</span>
          </a>
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

