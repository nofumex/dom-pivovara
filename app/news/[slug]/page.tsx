import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { notFound } from 'next/navigation'
import styles from '../page.module.scss'
import { getNewsBySlug } from '@/lib/news'

interface NewsPageProps {
  params: {
    slug: string
  }
}

export default function NewsDetailPage({ params }: NewsPageProps) {
  const newsItem = getNewsBySlug(params.slug)

  if (!newsItem) {
    notFound()
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Новости', href: '/news' },
    { label: newsItem.title, href: `/news/${newsItem.slug}` },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <article className={styles.article}>
          <h1 className={styles.title}>{newsItem.title}</h1>
          <p className={styles.date}>{newsItem.date}</p>
          <div className={styles.articleContent}>
            <p>{newsItem.content}</p>
          </div>
        </article>
      </div>
    </main>
  )
}


