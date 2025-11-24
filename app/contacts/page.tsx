import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from './page.module.scss'

export default function ContactsPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Контакты', href: '/contacts' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Контакты</h1>
        <div className={styles.content}>
          <div className={styles.contactBlock}>
            <h2>Телефоны</h2>
            <p>+7 913 555-222-6</p>
            <p>+7 913 037-32-47</p>
          </div>
          <div className={styles.contactBlock}>
            <h2>Email</h2>
            <p>info@dompivovara.ru</p>
          </div>
          <div className={styles.contactBlock}>
            <h2>Адрес</h2>
            <p>г. Москва, ул. Примерная, д. 1</p>
          </div>
        </div>
      </div>
    </main>
  )
}

