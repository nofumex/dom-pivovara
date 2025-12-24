'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/atoms/Button/Button'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from './page.module.scss'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber')

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Заказ оформлен', href: '/order/success' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <div className={styles.content}>
          <div className={styles.successIcon}>
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 className={styles.title}>Спасибо за ваш заказ!</h1>
          {orderNumber && (
            <div className={styles.orderNumberBox}>
              <p className={styles.orderNumberLabel}>Номер вашего заказа:</p>
              <p className={styles.orderNumber}>
                <strong>{orderNumber}</strong>
              </p>
            </div>
          )}
          <div className={styles.messageBox}>
            <p className={styles.message}>
              Ваш заказ успешно оформлен и принят в обработку.
            </p>
            <p className={styles.messageSecondary}>
              Мы свяжемся с вами в ближайшее время для подтверждения заказа.
              На указанный email будет отправлено письмо с деталями заказа.
            </p>
          </div>
          <div className={styles.actions}>
            <Link href="/catalog">
              <Button variant="primary">Продолжить покупки</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">На главную</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <main>
        <div className="container">
          <Breadcrumbs items={[
            { label: 'Главная', href: '/' },
            { label: 'Заказ оформлен', href: '/order/success' },
          ]} />
          <div className={styles.content}>
            <h1 className={styles.title}>Загрузка...</h1>
          </div>
        </div>
      </main>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}






