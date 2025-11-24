import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import Link from 'next/link'
import styles from './page.module.scss'

const articles = [
  {
    slug: 'yarfest-2023',
    title: 'ЯрФест 2023!',
    date: '15 мая 2023',
    preview: 'Обзор фестиваля пивоварения',
  },
  {
    slug: 'protsess-pivovareniya',
    title: 'Процесс приготовления пива',
    date: '10 апреля 2023',
    preview: 'Подробное руководство по пивоварению',
  },
  {
    slug: 'svetloe-pivo-venskoe',
    title: 'Светлое пиво: Венское',
    date: '5 марта 2023',
    preview: 'Рецепт и технология приготовления',
  },
]

export default function ArticlesPage() {
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
          {articles.map((article) => (
            <Link key={article.slug} href={`/articles/${article.slug}`} className={styles.card}>
              <div className={styles.image}></div>
              <div className={styles.content}>
                <h3 className={styles.cardTitle}>{article.title}</h3>
                <p className={styles.date}>{article.date}</p>
                <p className={styles.preview}>{article.preview}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

