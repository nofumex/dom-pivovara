import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import Link from 'next/link'
import styles from './page.module.scss'
import { prisma } from '@/lib/db'

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    where: {
      isPublished: true,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      date: true,
      preview: true,
      image: true,
      content: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      // layout excluded as it may not exist in database
    },
    orderBy: {
      date: 'desc',
    },
  })

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Статьи', href: '/articles' },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Статьи</h1>
        <div className={styles.grid}>
          {articles.map((article) => {
            const formattedDate = new Date(article.date).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })

            return (
              <Link key={article.slug} href={`/articles/${article.slug}`} className={styles.card}>
                <div className={styles.imageWrapper}>
                  <img
                    src={article.image}
                    alt={article.title}
                    className={styles.image}
                  />
                </div>
                <div className={styles.content}>
                  <h3 className={styles.cardTitle}>{article.title}</h3>
                  <p className={styles.date}>{formattedDate}</p>
                  <p className={styles.preview}>{article.preview}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}


















