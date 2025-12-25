'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import styles from './SettingsForm.module.scss'

interface HeroImage {
  id: string
  url: string
  alt: string | null
  title: string | null
  text: string | null
  buttonText: string | null
  buttonUrl: string | null
  order: number
  isActive: boolean
}

export function HeroSliderManager() {
  const [slides, setSlides] = useState<HeroImage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlide, setEditingSlide] = useState<HeroImage | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [sliderInterval, setSliderInterval] = useState('5000')

  useEffect(() => {
    fetchSlides()
    fetchInterval()
  }, [])

  const fetchSlides = async () => {
    try {
      const response = await fetch('/api/admin/hero-images', {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        setSlides(data.data.sort((a: HeroImage, b: HeroImage) => a.order - b.order))
      } else if (data.error) {
        console.error('Error fetching slides:', data.error)
      }
    } catch (error) {
      console.error('Error fetching slides:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInterval = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success && data.data.heroSliderInterval) {
        setSliderInterval(data.data.heroSliderInterval)
      }
    } catch (error) {
      console.error('Error fetching interval:', error)
    }
  }

  const handleSaveInterval = async () => {
    const interval = parseInt(sliderInterval)
    if (isNaN(interval) || interval < 2000) {
      alert('Интервал должен быть не менее 2000 мс (2 секунды)')
      return
    }

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ heroSliderInterval: interval.toString() }),
      })
      const data = await response.json()
      if (data.success) {
        alert('Интервал сохранен')
      } else {
        alert('Ошибка при сохранении интервала')
      }
    } catch (error) {
      console.error('Error saving interval:', error)
      alert('Ошибка при сохранении интервала')
    }
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingSlide({
      id: '',
      url: '',
      alt: '',
      title: '',
      text: '',
      buttonText: '',
      buttonUrl: '',
      order: slides.length,
      isActive: true,
    })
  }

  const handleEdit = (slide: HeroImage) => {
    setEditingSlide({ ...slide })
    setIsCreating(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить слайд?')) return

    try {
      const response = await fetch(`/api/admin/hero-images/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        fetchSlides()
      } else {
        alert('Ошибка при удалении слайда')
      }
    } catch (error) {
      console.error('Error deleting slide:', error)
      alert('Ошибка при удалении слайда')
    }
  }

  const handleSaveSlide = async () => {
    if (!editingSlide) return

    try {
      const slideData = {
        url: editingSlide.url,
        alt: editingSlide.alt || '',
        title: editingSlide.title || '',
        text: editingSlide.text || '',
        buttonText: editingSlide.buttonText || '',
        buttonUrl: editingSlide.buttonUrl || '',
        order: editingSlide.order,
        isActive: editingSlide.isActive,
      }

      let response
      if (isCreating) {
        response = await fetch('/api/admin/hero-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(slideData),
        })
      } else {
        response = await fetch(`/api/admin/hero-images/${editingSlide.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(slideData),
        })
      }

      const data = await response.json()
      if (data.success) {
        setEditingSlide(null)
        setIsCreating(false)
        fetchSlides()
        alert(isCreating ? 'Слайд создан' : 'Слайд обновлен')
      } else {
        alert(data.error || 'Ошибка при сохранении слайда')
      }
    } catch (error) {
      console.error('Error saving slide:', error)
      alert('Ошибка при сохранении слайда')
    }
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Управление слайдером</h2>

      <div className={styles.sliderSettings}>
        <h3 className={styles.subsectionTitle}>Настройки автоматической смены</h3>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <Input
            label="Интервал смены слайдов (мс)"
            type="number"
            value={sliderInterval}
            onChange={(e) => setSliderInterval(e.target.value)}
            placeholder="5000"
          />
          <Button variant="primary" onClick={handleSaveInterval}>
            Сохранить интервал
          </Button>
        </div>
        <p className={styles.hint}>
          Укажите интервал в миллисекундах (1000 мс = 1 секунда). Минимум: 2000 мс
        </p>
      </div>

      <div className={styles.slidesList}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className={styles.subsectionTitle}>Слайды</h3>
          <Button variant="primary" onClick={handleCreate}>
            + Добавить слайд
          </Button>
        </div>

        {slides.length === 0 && !editingSlide && (
          <p style={{ color: 'var(--color-text-secondary)' }}>Слайды не добавлены</p>
        )}

        {slides.map((slide) => (
          <div key={slide.id} className={styles.slideItem}>
            <div className={styles.slidePreview}>
              <img
                src={slide.url || '/placeholder.jpg'}
                alt={slide.alt || ''}
                className={styles.slideImage}
              />
              <div className={styles.slideInfo}>
                <h4>{slide.title || 'Без названия'}</h4>
                <p>{slide.text || 'Нет описания'}</p>
                <div className={styles.slideMeta}>
                  <span>Порядок: {slide.order}</span>
                  <span className={slide.isActive ? styles.active : styles.inactive}>
                    {slide.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.slideActions}>
              <Button variant="outline" onClick={() => handleEdit(slide)}>
                Редактировать
              </Button>
              <Button variant="outline" onClick={() => handleDelete(slide.id)}>
                Удалить
              </Button>
            </div>
          </div>
        ))}

        {editingSlide && (
          <div className={styles.slideEditor}>
            <h3 className={styles.subsectionTitle}>
              {isCreating ? 'Создание слайда' : 'Редактирование слайда'}
            </h3>
            <Input
              label="URL изображения"
              value={editingSlide.url}
              onChange={(e) => setEditingSlide({ ...editingSlide, url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              required
            />
            <Input
              label="Alt текст"
              value={editingSlide.alt || ''}
              onChange={(e) => setEditingSlide({ ...editingSlide, alt: e.target.value })}
              placeholder="Описание изображения"
            />
            <Input
              label="Заголовок"
              value={editingSlide.title || ''}
              onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
              placeholder="Заголовок слайда"
            />
            <Input
              label="Текст"
              textarea
              rows={3}
              value={editingSlide.text || ''}
              onChange={(e) => setEditingSlide({ ...editingSlide, text: e.target.value })}
              placeholder="Описание слайда"
            />
            <Input
              label="Текст кнопки"
              value={editingSlide.buttonText || ''}
              onChange={(e) => setEditingSlide({ ...editingSlide, buttonText: e.target.value })}
              placeholder="Подробнее"
            />
            <Input
              label="URL кнопки"
              value={editingSlide.buttonUrl || ''}
              onChange={(e) => setEditingSlide({ ...editingSlide, buttonUrl: e.target.value })}
              placeholder="/catalog"
            />
            <div style={{ display: 'flex', gap: '16px' }}>
              <Input
                label="Порядок"
                type="number"
                value={editingSlide.order}
                onChange={(e) => setEditingSlide({ ...editingSlide, order: parseInt(e.target.value) || 0 })}
              />
              <div className={styles.checkbox} style={{ marginTop: '24px' }}>
                <input
                  type="checkbox"
                  id="slideActive"
                  checked={editingSlide.isActive}
                  onChange={(e) => setEditingSlide({ ...editingSlide, isActive: e.target.checked })}
                />
                <label htmlFor="slideActive">Активен</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <Button variant="primary" onClick={handleSaveSlide}>
                Сохранить
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingSlide(null)
                  setIsCreating(false)
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

