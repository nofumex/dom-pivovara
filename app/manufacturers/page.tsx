import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import Link from 'next/link'
import styles from './page.module.scss'

const manufacturers = [
  {
    slug: 'samogon-i-vodka',
    name: 'Самогон и Водка',
    image: '/images/СамогониВодка.jpg',
  },
  {
    slug: 'stavbondar',
    name: 'Ставбондарь',
    image: '/images/Ставбондарь.jpg',
  },
  {
    slug: 'altayskiy-vinokur',
    name: 'Алтайский винокур',
    image: '/images/АлтайскийВинокур.jpg',
  },
  {
    slug: 'ded-altay',
    name: 'Дед Алтай',
    image: '/images/ДедАлтай.jpg',
  },
  {
    slug: 'iplate',
    name: 'IPlate',
    image: '/images/Iplate.jpg',
  },
]

export default function ManufacturersPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Производители', href: '/manufacturers' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Производители</h1>
        <div className={styles.content}>
          <p>
            Наш интернет-магазин является официальным дилером представленных торговых марок. 
            Это означает, что вся продукция действительно фирменная, никакого «серого импорта», 
            на все товары распространяется гарантия производителя, цены в нашем магазине соответствуют, 
            рекомендованным производителем.
          </p>
        </div>
        <div className={styles.grid}>
          {manufacturers.map((manufacturer) => (
            <Link
              key={manufacturer.slug}
              href={`/manufacturers/${manufacturer.slug}`}
              className={styles.card}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={manufacturer.image}
                  alt={manufacturer.name}
                  className={styles.image}
                />
              </div>
              <div className={styles.name}>{manufacturer.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

