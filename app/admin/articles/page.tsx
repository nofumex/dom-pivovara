'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.scss'

type ArticleLayout = 'TOP_FULL' | 'LEFT_SQUARE' | 'RIGHT_SQUARE'

type Article = {
  id: string
  slug: string
  title: string
  date: string
  preview: string
  image: string
  isPublished: boolean
  content: string
  layout: ArticleLayout
}

export default function AdminArticlesPage() {
  const [items, setItems] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Article> | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [newArticle, setNewArticle] = useState({
    slug: '',
    title: '',
    date: '',
    preview: '',
    image: '',
    content: '',
    layout: 'TOP_FULL' as ArticleLayout,
    isPublished: true,
  })

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/articles')
      const data = await res.json()
      if (data.success) {
        setItems(data.data || [])
      }
    } catch (e) {
      console.error('Admin articles fetch error:', e)
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
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newArticle),
      })
      const data = await res.json()
      if (data.success) {
        setNewArticle({
          slug: '',
          title: '',
          date: '',
          preview: '',
          image: '',
          content: '',
          layout: 'TOP_FULL' as ArticleLayout,
          isPublished: true,
        })
        await fetchItems()
        showNotification('Статья создана успешно!', 'success')
      } else {
        showNotification(data.error || 'Ошибка при создании статьи', 'error')
      }
    } catch (e) {
      console.error('Admin articles create error:', e)
      showNotification('Ошибка при создании статьи', 'error')
    } finally {
      setCreating(false)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleUpdate = async (slug: string, payload: Partial<Article> & { content?: string; date?: string }) => {
    try {
    const res = await fetch(`/api/admin/articles/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.success) {
      await fetchItems()
        showNotification('Изменения сохранены успешно!', 'success')
        setEditingSlug(null)
    } else {
        showNotification(data.error || 'Ошибка при обновлении статьи', 'error')
      }
    } catch (error) {
      showNotification('Ошибка при обновлении статьи', 'error')
    }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm('Удалить статью?')) return
    const res = await fetch(`/api/admin/articles/${slug}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await res.json()
    if (data.success) {
      await fetchItems()
    } else {
      alert(data.error || 'Ошибка при удалении статьи')
    }
  }

  return (
    <div className={styles.page}>
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}
      <div className={styles.header}>
        <h1>Статьи</h1>
        <p>Управление контентом блога: HTML-текст, изображения и публикация</p>
      </div>

      <section className={styles.card}>
        <h2>Создать статью</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Slug *</label>
              <input
                value={newArticle.slug}
                onChange={(e) => setNewArticle({ ...newArticle, slug: e.target.value })}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Заголовок *</label>
              <input
                value={newArticle.title}
                onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                required
              />
            </div>
          </div>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Дата (YYYY-MM-DD)</label>
              <input
                type="date"
                value={newArticle.date}
                onChange={(e) => setNewArticle({ ...newArticle, date: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>URL изображения *</label>
              <input
                value={newArticle.image}
                onChange={(e) => setNewArticle({ ...newArticle, image: e.target.value })}
                required
              />
            </div>
          </div>
          <div className={styles.field}>
            <label>Краткое описание (превью) *</label>
            <input
              value={newArticle.preview}
              onChange={(e) => setNewArticle({ ...newArticle, preview: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label>HTML-содержимое статьи *</label>
            <textarea
              rows={10}
              value={newArticle.content}
              onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
              placeholder="<p>HTML контент...</p>"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Шаблон расположения *</label>
            <div className={styles.layoutSelector}>
              <button
                type="button"
                className={`${styles.layoutButton} ${newArticle.layout === 'TOP_FULL' ? styles.active : ''}`}
                onClick={() => setNewArticle({ ...newArticle, layout: 'TOP_FULL' })}
              >
                <div className={styles.layoutPreview}>
                  <div className={styles.previewImageFull}></div>
                  <div className={styles.previewText}></div>
                </div>
                <span>Сверху картинка</span>
              </button>
              <button
                type="button"
                className={`${styles.layoutButton} ${newArticle.layout === 'LEFT_SQUARE' ? styles.active : ''}`}
                onClick={() => setNewArticle({ ...newArticle, layout: 'LEFT_SQUARE' })}
              >
                <div className={styles.layoutPreview}>
                  <div className={styles.previewRow}>
                    <div className={styles.previewImageSquare}></div>
                    <div className={styles.previewText}></div>
                  </div>
                </div>
                <span>Слева картинка</span>
              </button>
              <button
                type="button"
                className={`${styles.layoutButton} ${newArticle.layout === 'RIGHT_SQUARE' ? styles.active : ''}`}
                onClick={() => setNewArticle({ ...newArticle, layout: 'RIGHT_SQUARE' })}
              >
                <div className={styles.layoutPreview}>
                  <div className={styles.previewRow}>
                    <div className={styles.previewText}></div>
                    <div className={styles.previewImageSquare}></div>
                  </div>
                </div>
                <span>Справа картинка</span>
              </button>
            </div>
          </div>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={newArticle.isPublished}
              onChange={(e) =>
                setNewArticle({
                  ...newArticle,
                  isPublished: e.target.checked,
                })
              }
            />
            Опубликована
          </label>
          <button type="submit" disabled={creating} className={styles.button}>
            {creating ? 'Сохранение...' : 'Создать статью'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>Список статей</h2>
          {loading && <span>Загрузка...</span>}
        </div>
        <div className={styles.list}>
          {items.map((item) => {
            const isEditing = editingSlug === item.slug

            if (isEditing) {
              const currentEditData = editData || {
                slug: item.slug,
                title: item.title,
                date: item.date,
                preview: item.preview,
                image: item.image,
                content: item.content,
                layout: item.layout || 'TOP_FULL' as ArticleLayout,
                isPublished: item.isPublished,
              }
              return (
                <div key={item.id} className={styles.listItem}>
                  <div className={styles.editForm}>
                    <h3>Редактирование статьи</h3>
                    <div className={styles.grid}>
                      <div className={styles.field}>
                        <label>Slug *</label>
                        <input
                          value={currentEditData.slug || ''}
                          onChange={(e) => setEditData({ ...currentEditData, slug: e.target.value })}
                          required
                        />
                      </div>
                      <div className={styles.field}>
                        <label>Заголовок *</label>
                        <input
                          value={currentEditData.title || ''}
                          onChange={(e) => setEditData({ ...currentEditData, title: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.grid}>
                      <div className={styles.field}>
                        <label>Дата (YYYY-MM-DD)</label>
                        <input
                          type="date"
                          value={currentEditData.date || ''}
                          onChange={(e) => setEditData({ ...currentEditData, date: e.target.value })}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>URL изображения *</label>
                        <input
                          value={currentEditData.image || ''}
                          onChange={(e) => setEditData({ ...currentEditData, image: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.field}>
                      <label>Краткое описание (превью) *</label>
                      <input
                        value={currentEditData.preview || ''}
                        onChange={(e) => setEditData({ ...currentEditData, preview: e.target.value })}
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label>HTML-содержимое статьи *</label>
                      <textarea
                        rows={10}
                        value={currentEditData.content || ''}
                        onChange={(e) => setEditData({ ...currentEditData, content: e.target.value })}
                        placeholder="<p>HTML контент...</p>"
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label>Шаблон расположения *</label>
                      <div className={styles.layoutSelector}>
                        <button
                          type="button"
                          className={`${styles.layoutButton} ${(currentEditData.layout || 'TOP_FULL') === 'TOP_FULL' ? styles.active : ''}`}
                          onClick={() => setEditData({ ...currentEditData, layout: 'TOP_FULL' })}
                        >
                          <div className={styles.layoutPreview}>
                            <div className={styles.previewImageFull}></div>
                            <div className={styles.previewText}></div>
                          </div>
                          <span>Сверху картинка</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.layoutButton} ${(currentEditData.layout || 'TOP_FULL') === 'LEFT_SQUARE' ? styles.active : ''}`}
                          onClick={() => setEditData({ ...currentEditData, layout: 'LEFT_SQUARE' })}
                        >
                          <div className={styles.layoutPreview}>
                            <div className={styles.previewRow}>
                              <div className={styles.previewImageSquare}></div>
                              <div className={styles.previewText}></div>
                            </div>
                          </div>
                          <span>Слева картинка</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.layoutButton} ${(currentEditData.layout || 'TOP_FULL') === 'RIGHT_SQUARE' ? styles.active : ''}`}
                          onClick={() => setEditData({ ...currentEditData, layout: 'RIGHT_SQUARE' })}
                        >
                          <div className={styles.layoutPreview}>
                            <div className={styles.previewRow}>
                              <div className={styles.previewText}></div>
                              <div className={styles.previewImageSquare}></div>
                            </div>
                          </div>
                          <span>Справа картинка</span>
                        </button>
                      </div>
                    </div>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={currentEditData.isPublished || false}
                        onChange={(e) =>
                          setEditData({ ...currentEditData, isPublished: e.target.checked })
                        }
                      />
                      Опубликована
                    </label>
                    <div className={styles.actions}>
                      <button
                        className={styles.button}
                        onClick={async () => {
                          const updatePayload: any = {
                            title: currentEditData.title,
                            date: currentEditData.date,
                            preview: currentEditData.preview,
                            image: currentEditData.image,
                            content: currentEditData.content,
                            layout: currentEditData.layout || 'TOP_FULL',
                            isPublished: currentEditData.isPublished,
                          }
                          
                          // Если slug изменился, добавляем его в payload
                          if (currentEditData.slug && currentEditData.slug !== item.slug) {
                            updatePayload.slug = currentEditData.slug
                          }
                          
                          await handleUpdate(item.slug, updatePayload)
                        }}
                      >
                        Сохранить
                      </button>
                      <button
                        className={`${styles.button} ${styles.secondary}`}
                        onClick={() => {
                          setEditingSlug(null)
                          setEditData(null)
                        }}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
            <div key={item.id} className={styles.listItem}>
              <div className={styles.listRow}>
                <div>
                  <strong>{item.title}</strong>
                  <span className={styles.badge}>{item.slug}</span>
                </div>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={item.isPublished}
                    onChange={(e) =>
                      handleUpdate(item.slug, { isPublished: e.target.checked })
                    }
                  />
                  Опубликована
                </label>
              </div>
              <div className={styles.listRow}>
                <div className={styles.meta}>
                  <span>{item.date}</span>
                  <span>{item.preview}</span>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.button}
                      onClick={() => {
                        setEditingSlug(item.slug)
                        setEditData({
                          slug: item.slug,
                          title: item.title,
                          date: item.date,
                          preview: item.preview,
                          image: item.image,
                          content: item.content,
                          layout: item.layout || 'TOP_FULL' as ArticleLayout,
                          isPublished: item.isPublished,
                        })
                      }}
                  >
                      Редактировать
                  </button>
                  <button
                    className={`${styles.button} ${styles.danger}`}
                    onClick={() => handleDelete(item.slug)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}


