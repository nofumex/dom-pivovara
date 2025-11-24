import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from './page.module.scss'

const stores = [
  {
    city: 'Москва',
    address: 'ул. Примерная, д. 1',
    phone: '+7 913 555-222-6',
    hours: 'Пн-Пт: 9:00-18:00',
  },
  {
    city: 'Санкт-Петербург',
    address: 'пр. Невский, д. 100',
    phone: '+7 913 037-32-47',
    hours: 'Пн-Пт: 9:00-18:00',
  },
]

export default function StoresPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Магазины', href: '/stores' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Магазины</h1>
        <div className={styles.grid}>
          {stores.map((store, index) => (
            <div key={index} className={styles.card}>
              <h3 className={styles.cardTitle}>{store.city}</h3>
              <p className={styles.address}>{store.address}</p>
              <p className={styles.phone}>{store.phone}</p>
              <p className={styles.hours}>{store.hours}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

