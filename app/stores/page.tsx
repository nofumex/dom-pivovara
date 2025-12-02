import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from './page.module.scss'

const stores = [
  {
    city: 'Красноярск',
    address: 'ул. Молокова 17',
    phone: '+7 (913) 555-222-6',
    hours: 'Пн-Пт – с 10:00 до 20:00\nСб – с 10:00 до 18:00\nВс - с 10:00 до 16:00',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2222.1234567890123!2d92.8525729!3d56.010569!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTbCsDAwJzM4LjAiTiA5MsKwNTEnMDkuMyJF!5e0!3m2!1sru!2sru!4v1234567890123!5m2!1sru!2sru',
  },
  {
    city: 'Красноярск',
    address: 'ул. Семафорная 271 стр.7',
    phone: '+7 (913) 037-32-47',
    hours: 'Пн-Пт – с 10:00 до 20:00\nСб – с 10:00 до 18:00\nВс - с 10:00 до 16:00',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2222.1234567890124!2d92.8600000!3d56.0200000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTbCsDAxJzEyLjAiTiA5MsKwNTEnMzYuMCJF!5e0!3m2!1sru!2sru!4v1234567890124!5m2!1sru!2sru',
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
              <div className={styles.hours}>
                {store.hours.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div className={styles.mapContainer}>
                <iframe
                  src={store.mapUrl}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className={styles.map}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}





