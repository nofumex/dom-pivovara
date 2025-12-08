'use client'

import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from '../page.module.scss'

export default function SalesMonthlyPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Акции', href: '/sales' },
    { label: 'Акции месяца', href: '/sales/monthly' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <section className={styles.content}>
          <h1 className={styles.title}>Акции месяца</h1>

          <p className={styles.lead}>ВНИМАНИЕ, СКИДКИ!</p>

          <p className={styles.text}>
            Летние скидки в магазине &quot;ДомПивовар&quot;.
          </p>

          <p className={styles.text}>Условия очень просты:</p>
          <ul className={styles.list}>
            <li>При покупке любого узбекского казана скидка 10%</li>
            <li>При покупке узбекского казана + любая печь или мангал — скидка 15%</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
