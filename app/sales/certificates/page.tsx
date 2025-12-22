'use client'

import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from '../page.module.scss'

export default function SalesCertificatesPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Акции', href: '/sales' },
    { label: 'Подарочные сертификаты', href: '/sales/certificates' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <section className={styles.content}>
          <h1 className={styles.title}>Подарочные сертификаты</h1>
          <p className={styles.text}>У нас Вы найдете подарочные сертификаты на сумму:</p>
          <ul className={styles.list}>
            <li>500 рублей</li>
            <li>1000 рублей</li>
            <li>3000 рублей</li>
            <li>5000 рублей</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
