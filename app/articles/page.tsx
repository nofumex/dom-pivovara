import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import Link from 'next/link'
import styles from './page.module.scss'

const articles = [
  {
    slug: 'yarfest-2023',
    title: 'ЯрФест 2023!',
    date: '15 мая 2023',
    preview: 'Обзор фестиваля пивоварения',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
  },
  {
    slug: 'protsess-pivovareniya',
    title: 'Процесс приготовления пива',
    date: '10 апреля 2023',
    preview: 'Подробное руководство по пивоварению',
    image: 'https://images.unsplash.com/photo-1556910103-1c0275a7f751?w=400&h=300&fit=crop',
  },
  {
    slug: 'svetloe-pivo-venskoe',
    title: 'Светлое пиво: Венское',
    date: '5 марта 2023',
    preview: 'Рецепт и технология приготовления',
    image: 'https://images.unsplash.com/photo-1535958637004-8967b9ed21ca?w=400&h=300&fit=crop',
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
              <div className={styles.imageWrapper}>
                <img
                  src={article.image}
                  alt={article.title}
                  className={styles.image}
                />
              </div>
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




