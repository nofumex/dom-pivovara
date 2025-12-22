'use client'

import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from '../page.module.scss'

export default function SalesDiscountsPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Акции', href: '/sales' },
    { label: 'Скидки', href: '/sales/discounts' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <section className={styles.content}>
          <h1 className={styles.title}>Скидки</h1>

          <p className={styles.text}>
            Рады сообщить вам, что в наших магазинах и интернет заказах уже многие годы действует достаточно
            простая и очень привлекательная для наших покупателей система скидок.
          </p>

          <p className={styles.text}>Есть два вида скидок - разовая и накопительная.</p>

          <h3 className={styles.actionTitle}>Разовая скидка</h3>
          <p className={styles.text}>
            Разовая скидка предоставляется любому покупателю на товар участвующий в оптовой продаже.
          </p>

          <h3 className={styles.actionTitle}>Накопительная скидка</h3>
          <p className={styles.text}>
            Накопительная скидка начинает работать со второй покупки и дается постоянным покупателям. Для этого не
            нужно заводить карту или заполнять анкету, наш сотрудник запишет ваш номер телефона и имя. Вот вы уже
            наш постоянный покупатель с накопительной скидкой. Скидки не распространяются на некоторые виды товаров.
            Всю дополнительную информацию об акциях вы также можете узнать позвонив по телефонам указанных в контактах.
          </p>

          <p className={styles.text}>
            Сумма сделанных и оплаченных заказов более 3000р. составит 3%<br />
            Сумма сделанных и оплаченных заказов более 30 000р. составит 5%
          </p>
        </section>
      </div>
    </main>
  )
}
