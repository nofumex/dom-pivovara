import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { notFound } from 'next/navigation'
import styles from '../page.module.scss'
import { prisma } from '@/lib/db'

interface ArticlePageProps {
  params: {
    slug: string
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await prisma.article.findUnique({
    where: {
      slug: params.slug,
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
  })

  if (!article) {
    notFound()
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Статьи', href: '/articles' },
    { label: article.title, href: `/articles/${article.slug}` },
  ]

  // Форматируем дату для отображения
  const formattedDate = new Date(article.date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Default layout since layout field may not exist in database
  const layout = 'TOP_FULL' as 'TOP_FULL' | 'LEFT_SQUARE' | 'RIGHT_SQUARE'

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <article className={`${styles.article} ${styles[`layout${layout}`]}`}>
          <h1 className={styles.title}>{article.title}</h1>
          <p className={styles.date}>{formattedDate}</p>
          
          {layout === 'TOP_FULL' && (
            <>
              <div className={styles.imageWrapper}>
                <img
                  src={article.image}
                  alt={article.title}
                  className={styles.image}
                />
              </div>
              <div 
                className={styles.articleContent}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </>
          )}

          {layout === 'LEFT_SQUARE' && (
            <div className={styles.layoutSide}>
              <div className={styles.imageWrapperSquare}>
                <img
                  src={article.image}
                  alt={article.title}
                  className={styles.image}
                />
              </div>
              <div 
                className={styles.articleContent}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>
          )}

          {layout === 'RIGHT_SQUARE' && (
            <div className={styles.layoutSide}>
              <div 
                className={styles.articleContent}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
              <div className={styles.imageWrapperSquare}>
                <img
                  src={article.image}
                  alt={article.title}
                  className={styles.image}
                />
              </div>
            </div>
          )}
        </article>
      </div>
    </main>
  )
}


