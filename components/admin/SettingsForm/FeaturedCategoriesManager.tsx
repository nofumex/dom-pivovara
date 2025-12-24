 'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import styles from './SettingsForm.module.scss'

type TileSize = 'small' | 'medium' | 'large'

interface FeaturedCategoryTile {
  id: string
  title: string
  url: string
  imageUrl: string
  size: TileSize
  order: number
  isActive: boolean
}

export function FeaturedCategoriesManager() {
  const [tiles, setTiles] = useState<FeaturedCategoryTile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTile, setEditingTile] = useState<FeaturedCategoryTile | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchTiles()
  }, [])

  const fetchTiles = async () => {
    try {
      const response = await fetch('/api/admin/featured-categories', {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        setTiles(
          data.data.sort((a: FeaturedCategoryTile, b: FeaturedCategoryTile) => a.order - b.order),
        )
      }
    } catch (error) {
      console.error('Error fetching featured categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingTile({
      id: '',
      title: '',
      url: '/catalog',
      imageUrl: '',
      size: 'medium',
      order: tiles.length,
      isActive: true,
    })
  }

  const handleEdit = (tile: FeaturedCategoryTile) => {
    setIsCreating(false)
    setEditingTile({ ...tile })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить карточку?')) return

    try {
      const response = await fetch(`/api/admin/featured-categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        fetchTiles()
      } else {
        alert('Ошибка при удалении карточки')
      }
    } catch (error) {
      console.error('Error deleting featured category:', error)
      alert('Ошибка при удалении карточки')
    }
  }

  const handleSaveTile = async () => {
    if (!editingTile) return

    try {
      const payload = {
        title: editingTile.title,
        url: editingTile.url,
        imageUrl: editingTile.imageUrl,
        size: editingTile.size,
        order: editingTile.order,
        isActive: editingTile.isActive,
      }

      let response
      if (isCreating) {
        response = await fetch('/api/admin/featured-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch(`/api/admin/featured-categories/${editingTile.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
      }

      const data = await response.json()
      if (data.success) {
        setEditingTile(null)
        setIsCreating(false)
        fetchTiles()
        alert(isCreating ? 'Карточка создана' : 'Карточка обновлена')
      } else {
        alert(data.error || 'Ошибка при сохранении карточки')
      }
    } catch (error) {
      console.error('Error saving featured category:', error)
      alert('Ошибка при сохранении карточки')
    }
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Карточки категорий на главной</h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 className={styles.subsectionTitle}>Карточки</h3>
        <Button variant="primary" onClick={handleCreate}>
          + Добавить карточку
        </Button>
      </div>

      {tiles.length === 0 && !editingTile && (
        <p style={{ color: 'var(--color-text-secondary)' }}>Карточки не добавлены</p>
      )}

      {tiles.map((tile) => (
        <div key={tile.id} className={styles.slideItem}>
          <div className={styles.slidePreview}>
            <img
              src={tile.imageUrl || '/placeholder.jpg'}
              alt={tile.title}
              className={styles.slideImage}
            />
            <div className={styles.slideInfo}>
              <h4>{tile.title || 'Без названия'}</h4>
              <div className={styles.slideMeta}>
                <span>Порядок: {tile.order}</span>
                <span>Размер: {tile.size}</span>
                <span className={tile.isActive ? styles.active : styles.inactive}>
                  {tile.isActive ? 'Активна' : 'Неактивна'}
                </span>
              </div>
              <div className={styles.slideMeta}>
                <span>Ссылка: {tile.url}</span>
              </div>
            </div>
          </div>
          <div className={styles.slideActions}>
            <Button variant="outline" onClick={() => handleEdit(tile)}>
              Редактировать
            </Button>
            <Button variant="outline" onClick={() => handleDelete(tile.id)}>
              Удалить
            </Button>
          </div>
        </div>
      ))}

      {editingTile && (
        <div className={styles.slideEditor}>
          <h3 className={styles.subsectionTitle}>
            {isCreating ? 'Создание карточки' : 'Редактирование карточки'}
          </h3>
          <Input
            label="Заголовок"
            value={editingTile.title}
            onChange={(e) => setEditingTile({ ...editingTile, title: e.target.value })}
            placeholder="Пивоварение"
            required
          />
          <Input
            label="URL (ссылка при клике)"
            value={editingTile.url}
            onChange={(e) => setEditingTile({ ...editingTile, url: e.target.value })}
            placeholder="/catalog/pivovareniye"
            required
          />
          <Input
            label="URL изображения (фон)"
            value={editingTile.imageUrl}
            onChange={(e) => setEditingTile({ ...editingTile, imageUrl: e.target.value })}
            placeholder="https://..."
            required
          />
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label className={styles.label}>Размер плитки</label>
              <select
                className={styles.select}
                value={editingTile.size}
                onChange={(e) =>
                  setEditingTile({ ...editingTile, size: e.target.value as TileSize })
                }
              >
                <option value="small">Маленький</option>
                <option value="medium">Средний</option>
                <option value="large">Большой</option>
              </select>
            </div>
            <Input
              label="Порядок"
              type="number"
              value={editingTile.order}
              onChange={(e) =>
                setEditingTile({
                  ...editingTile,
                  order: parseInt(e.target.value, 10) || 0,
                })
              }
            />
            <div className={styles.checkbox} style={{ marginTop: '24px' }}>
              <input
                type="checkbox"
                id="tileActive"
                checked={editingTile.isActive}
                onChange={(e) =>
                  setEditingTile({
                    ...editingTile,
                    isActive: e.target.checked,
                  })
                }
              />
              <label htmlFor="tileActive">Активна</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <Button variant="primary" onClick={handleSaveTile}>
              Сохранить
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTile(null)
                setIsCreating(false)
              }}
            >
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}




















