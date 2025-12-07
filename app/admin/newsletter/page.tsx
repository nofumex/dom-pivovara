'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import styles from './page.module.scss'

export default function NewsletterPage() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [isHtml, setIsHtml] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subscribersCount, setSubscribersCount] = useState(0)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    fetchSubscribersCount()
  }, [])

  const fetchSubscribersCount = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/count')
      const data = await response.json()
      if (data.success) {
        setSubscribersCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching subscribers count:', error)
    }
  }

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      alert('Заполните тему и содержимое письма')
      return
    }

    if (!confirm(`Отправить рассылку ${subscribersCount} подписчикам?`)) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject,
          content,
          isHtml,
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert(`Рассылка успешно отправлена ${data.sentCount} подписчикам!`)
        setSubject('')
        setContent('')
        setIsHtml(false)
      } else {
        alert(data.error || 'Ошибка при отправке рассылки')
      }
    } catch (error) {
      console.error('Error sending newsletter:', error)
      alert('Ошибка при отправке рассылки')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Email рассылка</h1>
          <p className={styles.subtitle}>
            Управление рассылкой для подписчиков ({subscribersCount} активных подписчиков)
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <input
                type="checkbox"
                checked={isHtml}
                onChange={(e) => setIsHtml(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              HTML формат
            </label>
          </div>

          <Input
            label="Тема письма"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Например: Новые акции и скидки!"
            required
          />

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Содержимое письма {isHtml && '(HTML)'}
            </label>
            <div className={styles.buttonGroup}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? 'Редактировать' : 'Предпросмотр'}
              </Button>
            </div>
            {previewMode && isHtml ? (
              <div
                className={styles.preview}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : previewMode ? (
              <div className={styles.preview}>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {content}
                </pre>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={styles.textarea}
                rows={15}
                placeholder={
                  isHtml
                    ? '<html><body><h1>Ваше HTML содержимое</h1></body></html>'
                    : 'Введите текст письма...'
                }
                required
              />
            )}
          </div>

          <div className={styles.actions}>
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={isSubmitting || !subject.trim() || !content.trim()}
            >
              {isSubmitting ? 'Отправка...' : `Отправить ${subscribersCount} подписчикам`}
            </Button>
          </div>
        </div>

        <div className={styles.info}>
          <h2>Рекомендации</h2>
          <ul>
            <li>Используйте HTML формат для красивого оформления писем</li>
            <li>Всегда проверяйте письмо в режиме предпросмотра перед отправкой</li>
            <li>Используйте персональные обращения для лучшего эффекта</li>
            <li>Письма отправляются последовательно, процесс может занять время</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
