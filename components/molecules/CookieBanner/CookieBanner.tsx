'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCookieConsentStatus, setCookieConsent } from '@/lib/cookies'
import { Button } from '@/components/atoms/Button/Button'
import styles from './CookieBanner.module.scss'

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Проверяем, дал ли пользователь уже согласие
    const consentStatus = getCookieConsentStatus()
    if (consentStatus === null) {
      // Показываем баннер только если согласие еще не было дано
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    setCookieConsent(true)
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <p className={styles.text}>
          Мы используем файлы cookie для работы сайта, аналитики и улучшения сервиса. Продолжая пользоваться сайтом, вы соглашаетесь с использованием cookie. Подробнее — в{' '}
          <Link href="/privaci" className={styles.link}>
            Политике обработки персональных данных
          </Link>
          .
        </p>
        <Button
          variant="primary"
          onClick={handleAccept}
          className={styles.button}
        >
          Понятно
        </Button>
      </div>
    </div>
  )
}

