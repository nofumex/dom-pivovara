'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CallbackModal } from '@/components/molecules/CallbackModal/CallbackModal'
import styles from './Footer.module.scss'

export function Footer() {
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false)

  return (
    <>
  return (
    <footer className={styles.footer}>
      <div className={styles.partners}>
        <div className="container">
          <div className={styles.partnersGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={styles.partnerLogo}></div>
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

