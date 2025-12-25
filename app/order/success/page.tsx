'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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
    <main className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <div className={styles.content}>
          <div className={styles.successIcon}>✓</div>
          <h1 className={styles.title}>Заказ успешно оформлен!</h1>
          {orderNumber && (
            <p className={styles.orderNumber}>
              Номер вашего заказа: <strong>{orderNumber}</strong>
            </p>
          )}
          <p className={styles.message}>
            Мы свяжемся с вами в ближайшее время для подтверждения заказа.
          </p>
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
      <main className={styles.page}>
        <div className="container">
          <Breadcrumbs items={[
            { label: 'Главная', href: '/' },
            { label: 'Заказ оформлен', href: '/order/success' },
          ]} />
          <div className={styles.content}>
            <div className={styles.loading}>Загрузка...</div>
          </div>
        </div>
      </main>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}






