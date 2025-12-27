import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { prisma } from '@/lib/db'
import styles from './page.module.scss'

export const dynamic = 'force-dynamic'

export default async function StoresPage() {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
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
          {stores.map((store) => (
            <div key={store.id} className={styles.card}>
              <h3 className={styles.cardTitle}>{store.address}</h3>
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


























