'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './SidebarSections.module.scss'

const salesNavItems = [
  { label: 'Акции месяца', href: '/sales/monthly' },
  { label: 'Скидки', href: '/sales/discounts' },
  { label: 'Подарочные сертификаты', href: '/sales/certificates' },
]

interface ArticleItemProps {
  article: {
    slug: string
    image: string
    title: string
    fallback?: string
  }
}

function ArticleItem({ article }: ArticleItemProps) {
  const [imageError, setImageError] = useState(false)
  
  return (
    <Link href={`/articles/${article.slug}`} className={styles.articleItem}>
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [articles, setArticles] = useState<ArticleItemProps['article'][]>([])
  const pathname = usePathname()
  const isSalesPage = pathname?.startsWith('/sales/') && pathname !== '/sales'

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Спасибо за подписку!' })
        setEmail('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Ошибка при подписке' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при подписке' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const newsItems = [
    {
      date: '19 апреля 2022',
      title: 'Новый сайт Дома Пивовара',
      href: '/news/novyy-sayt-dompivovar',
    },
  ]

  useEffect(() => {
    let isMounted = true

    const loadArticles = async () => {
      try {
        const res = await fetch('/api/articles/sidebar')
        if (!res.ok) return
        const data = await res.json()

        if (!isMounted) return

        const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
        if (Array.isArray(items) && items.length) {
          setArticles(
            items.map((item: any) => ({
              slug: item.slug,
              title: item.title,
              image: item.image,
              fallback: '🍺',
            }))
          )
        } else {
          setArticles([])
        }
      } catch (error) {
        console.error('Sidebar articles load error:', error)
      }
    }

    loadArticles()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className={styles.sections}>
      {isSalesPage && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Акции</h3>
          <nav className={styles.salesNav}>
            {salesNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.salesNavLink} ${isActive ? styles.salesNavLinkActive : ''}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

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
          <button 
            type="submit" 
            className={styles.newsletterButton} 
            aria-label="Подписаться"
            disabled={isSubmitting}
          >
            {isSubmitting ? '...' : '→'}
          </button>
        </form>
        {message && (
          <p 
            style={{ 
              marginTop: '12px', 
              fontSize: '14px',
              color: message.type === 'success' ? '#10b981' : '#ef4444'
            }}
          >
            {message.text}
          </p>
        )}
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
        {articles.length > 0 && (
          <div className={styles.articlesList}>
            {articles.map((article) => (
              <ArticleItem key={article.slug} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

