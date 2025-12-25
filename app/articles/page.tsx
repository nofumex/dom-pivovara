import Link from 'next/link'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { prisma } from '@/lib/db'
import styles from './page.module.scss'

export default async function ArticlesPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Статьи', href: '/articles' },
  ]

  const articles = await prisma.article.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      date: 'desc',
    },
    select: {
      id: true,
      slug: true,
      title: true,
      date: true,
      preview: true,
      image: true,
      isPublished: true,
    },
  })

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Статьи</h1>
        
        {articles.length === 0 ? (
          <p>Статьи не найдены</p>
        ) : (
          <div className={styles.articlesGrid}>
            {articles.map((article) => {
              const formattedDate = new Date(article.date).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })

              return (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className={styles.articleCard}
                >
                  {article.image && (
                    <div className={styles.articleImage}>
                      <img
                        src={article.image}
                        alt={article.title}
                      />
                    </div>
                  )}
                  <div className={styles.articleContent}>
                    <h2 className={styles.articleTitle}>{article.title}</h2>
                    <p className={styles.articleDate}>{formattedDate}</p>
                    {article.preview && (
                      <p className={styles.articleExcerpt}>{article.preview}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
