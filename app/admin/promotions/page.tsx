'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.scss'

type PromotionPage = {
  id: string
  slug: string
  title: string
  content: string
  isActive: boolean
}

export default function AdminPromotionsPage() {
  const [items, setItems] = useState<PromotionPage[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newPage, setNewPage] = useState({
    slug: '',
    title: '',
    content: '',
    isActive: true,
  })

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/promotions')
      const data = await res.json()
      if (data.success) {
        setItems(data.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPage),
      })
      if (res.ok) {
        setNewPage({ slug: '', title: '', content: '', isActive: true })
        await fetchItems()
      } else {
        alert('Ошибка при создании страницы')
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка при создании страницы')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async (slug: string, payload: Partial<PromotionPage>) => {
    const res = await fetch(`/api/admin/promotions/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      await fetchItems()
    } else {
      alert('Ошибка при обновлении')
    }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm('Удалить страницу?')) return
    const res = await fetch(`/api/admin/promotions/${slug}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      await fetchItems()
    } else {
      alert('Ошибка при удалении')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Промо-страницы</h1>
        <p>Редактируйте тексты страниц раздела «Акции»</p>
      </div>

      <section className={styles.card}>
        <h2>Создать страницу</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.field}>
            <label>Slug *</label>
            <input
              value={newPage.slug}
              onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Заголовок *</label>
            <input
              value={newPage.title}
              onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Содержимое *</label>
            <textarea
              rows={6}
              value={newPage.content}
              onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
              required
            />
          </div>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={newPage.isActive}
              onChange={(e) => setNewPage({ ...newPage, isActive: e.target.checked })}
            />
            Активна
          </label>
          <button type="submit" disabled={creating}>
            {creating ? 'Сохранение...' : 'Создать'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>Список страниц</h2>
          {loading && <span>Загрузка...</span>}
        </div>
        <div className={styles.list}>
          {items.map((item) => (
            <div key={item.id} className={styles.listItem}>
              <div className={styles.listRow}>
                <strong>{item.title}</strong>
                <span className={styles.badge}>{item.slug}</span>
              </div>
              <div className={styles.listRow}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(e) => handleUpdate(item.slug, { isActive: e.target.checked })}
                  />
                  Активна
                </label>
                <div className={styles.actions}>
                  <button onClick={() => handleUpdate(item.slug, { title: item.title, content: item.content })}>
                    Сохранить
                  </button>
                  <button className={styles.danger} onClick={() => handleDelete(item.slug)}>
                    Удалить
                  </button>
                </div>
              </div>
              <textarea
                className={styles.editArea}
                rows={6}
                value={item.content}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((p) => (p.id === item.id ? { ...p, content: e.target.value } : p))
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}








