import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from './page.module.scss'

export default function DeliveryPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Доставка и оплата', href: '/delivery' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Доставка и оплата</h1>
        <div className={styles.content}>
          <section>
            <h2>Способы доставки</h2>
            <ul>
              <li>Самовывоз из магазина</li>
              <li>Курьерская доставка по городу</li>
              <li>Доставка транспортной компанией</li>
            </ul>
          </section>
          <section>
            <h2>Способы оплаты</h2>
            <ul>
              <li>Наличными при получении</li>
              <li>Банковской картой онлайн</li>
              <li>Банковским переводом</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}

