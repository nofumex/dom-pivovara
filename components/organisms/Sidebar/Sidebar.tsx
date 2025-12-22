'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/atoms/Button/Button'
import styles from './Sidebar.module.scss'

export function Sidebar() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubscribe = async (e: React.FormEvent) => {
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

  const news = [
    { date: '19 апреля 2022', title: 'Новый сайт ДомПивовар', slug: 'novyy-sayt' },
  ]

  const articles = [
    { title: 'ЯрФест 2023!', slug: 'yarfest-2023' },
    { title: 'Процесс приготовления пива', slug: 'protsess-pivovareniya' },
    { title: 'Светлое пиво: Венское', slug: 'svetloe-pivo-venskoe' },
  ]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.subscribe}>
        <h3 className={styles.title}>Будьте всегда в курсе!</h3>
        <p className={styles.subtitle}>Узнавайте о скидках и акциях первыми</p>
        <form onSubmit={handleSubscribe} className={styles.form}>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              placeholder="Ваш e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
            <button 
              type="submit" 
              className={styles.submitButton} 
              aria-label="Подписаться"
              disabled={isSubmitting}
            >
              {isSubmitting ? '...' : '→'}
            </button>
          </div>
          {message && (
            <p 
              className={message.type === 'success' ? styles.successMessage : styles.errorMessage}
              style={{ marginTop: '12px', fontSize: '14px' }}
            >
              {message.text}
            </p>
          )}
        </form>
      </div>

      <div className={styles.news}>
        <h3 className={styles.sectionTitle}>Новости</h3>
        <ul className={styles.list}>
          {news.map((item) => (
            <li key={item.slug} className={styles.listItem}>
              <span className={styles.date}>{item.date}</span>
              <Link href={`/news/${item.slug}`} className={styles.link}>
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/news" className={styles.allLink}>
          Все новости
        </Link>
      </div>

      <div className={styles.articles}>
        <h3 className={styles.sectionTitle}>Статьи</h3>
        <ul className={styles.list}>
          {articles.map((article) => (
            <li key={article.slug} className={styles.articleItem}>
              <div className={styles.articleImage}></div>
              <Link href={`/articles/${article.slug}`} className={styles.articleLink}>
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/articles" className={styles.allLink}>
          Все статьи
        </Link>
      </div>
    </aside>
  )
}









