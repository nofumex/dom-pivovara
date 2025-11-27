import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import Link from 'next/link'
import styles from './page.module.scss'

const news = [
  {
    slug: 'novyy-sayt',
    title: 'Новый сайт ДомПивовар',
    date: '19 апреля 2022',
    preview: 'Мы запустили новый сайт с улучшенным дизайном и функционалом',
  },
]

export default function NewsPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Новости', href: '/news' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Новости</h1>
        <div className={styles.list}>
          {news.map((item) => (
            <Link key={item.slug} href={`/news/${item.slug}`} className={styles.item}>
              <span className={styles.date}>{item.date}</span>
              <h3 className={styles.itemTitle}>{item.title}</h3>
              <p className={styles.preview}>{item.preview}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}


