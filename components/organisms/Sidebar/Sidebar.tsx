'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/atoms/Button/Button'
import styles from './Sidebar.module.scss'

export function Sidebar() {
  const [email, setEmail] = useState('')

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle subscription
    alert('Спасибо за подписку!')
    setEmail('')
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
            <button type="submit" className={styles.submitButton} aria-label="Подписаться">
              →
            </button>
          </div>
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








