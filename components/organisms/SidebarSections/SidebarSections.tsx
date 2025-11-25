'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './SidebarSections.module.scss'

interface ArticleItemProps {
  article: {
    image: string
    title: string
    href: string
    fallback: string
  }
}

function ArticleItem({ article }: ArticleItemProps) {
  const [imageError, setImageError] = useState(false)
  
  return (
    <Link href={article.href} className={styles.articleItem}>
      <div className={styles.articleThumbnail}>
        {imageError ? (
          <div className={styles.articleFallback}>
            {article.fallback || '📄'}
          </div>
        ) : (
          <img
            src={article.image}
            alt={article.title}
            className={styles.articleImage}
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <span className={styles.articleTitle}>{article.title}</span>
    </Link>
  )
}

export function SidebarSections() {
  const [email, setEmail] = useState('')

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement newsletter subscription
    console.log('Newsletter subscription:', email)
    setEmail('')
  }

  const newsItems = [
    {
      date: '19 апреля 2022',
      title: 'Новый сайт ДомПивовар',
      href: '/news/novyy-sayt-dompivovar',
    },
  ]

  const articles = [
    {
      image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop',
      title: 'ЯрФест 2023!',
      href: '/articles/yarfest-2023',
      fallback: '🍺',
    },
    {
      image: 'https://images.unsplash.com/photo-1556910103-1c0275a7f751?w=200&h=200&fit=crop',
      title: 'Процесс приготовления пива',
      href: '/articles/beer-brewing-process',
      fallback: '🍺',
    },
    {
      image: 'https://images.unsplash.com/photo-1535958637004-8967b9ed21ca?w=200&h=200&fit=crop',
      title: 'Светлое пиво: Венское',
      href: '/articles/vienna-beer',
      fallback: '🍺',
    },
  ]

  return (
    <div className={styles.sections}>
      {/* Newsletter Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Будьте всегда в курсе!</h3>
        <p className={styles.sectionSubtitle}>
          Узнавайте о скидках и акциях первым
        </p>
        <form onSubmit={handleNewsletterSubmit} className={styles.newsletterForm}>
          <input
            type="email"
            placeholder="Ваш e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.newsletterInput}
            required
          />
          <button type="submit" className={styles.newsletterButton} aria-label="Подписаться">
            →
          </button>
        </form>
      </div>

      {/* News Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Новости</h3>
          <Link href="/news" className={styles.sectionLink}>
            Все новости
          </Link>
        </div>
        <div className={styles.newsList}>
          {newsItems.map((item, index) => (
            <Link key={index} href={item.href} className={styles.newsItem}>
              <span className={styles.newsDate}>{item.date}</span>
              <span className={styles.newsTitle}>{item.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Articles Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Статьи</h3>
          <Link href="/articles" className={styles.sectionLink}>
            Все статьи
          </Link>
        </div>
        <div className={styles.articlesList}>
          {articles.map((article, index) => (
            <ArticleItem key={index} article={article} />
          ))}
        </div>
      </div>
    </div>
  )
}

