'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import styles from './SettingsForm.module.scss'

interface Store {
  id: string
  address: string
  mapUrl: string
  order: number
  isActive: boolean
}

export function StoresManager() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/admin/stores', {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        setStores(data.data.sort((a: Store, b: Store) => a.order - b.order))
      } else if (data.error) {
        console.error('Error fetching stores:', data.error)
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text })
    setTimeout(() => {
      setSaveMessage(null)
    }, type === 'success' ? 3000 : 5000)
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingStore({
      id: '',
      address: '',
      mapUrl: '',
      order: stores.length,
      isActive: true,
    })
  }

  const handleEdit = (store: Store) => {
    setEditingStore({ ...store })
    setIsCreating(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить магазин?')) return

    try {
      const response = await fetch(`/api/admin/stores/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        fetchStores()
        showMessage('success', 'Магазин удален')
      } else {
        showMessage('error', data.error || 'Ошибка при удалении магазина')
      }
    } catch (error) {
      console.error('Error deleting store:', error)
      showMessage('error', 'Ошибка при удалении магазина')
    }
  }

  const handleSaveStore = async () => {
    if (!editingStore) return

    if (!editingStore.address || !editingStore.mapUrl) {
      showMessage('error', 'Заполните обязательные поля: Адрес, URL карты')
      return
    }

    try {
      const storeData = {
        address: editingStore.address,
        mapUrl: editingStore.mapUrl,
        order: editingStore.order,
        isActive: editingStore.isActive,
      }

      let response
      if (isCreating) {
        response = await fetch('/api/admin/stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(storeData),
        })
      } else {
        response = await fetch(`/api/admin/stores/${editingStore.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(storeData),
        })
      }

      const data = await response.json()
      if (data.success) {
        setEditingStore(null)
        setIsCreating(false)
        fetchStores()
        showMessage('success', isCreating ? 'Магазин создан' : 'Магазин обновлен')
      } else {
        showMessage('error', data.error || 'Ошибка при сохранении магазина')
      }
    } catch (error) {
      console.error('Error saving store:', error)
      showMessage('error', 'Ошибка при сохранении магазина')
    }
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Управление магазинами</h2>

      {saveMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: saveMessage.type === 'success' ? '#27ae60' : '#e74c3c',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {saveMessage.text}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Управляйте адресами магазинов, которые отображаются на странице контактов.
          При изменении адреса обновите также URL карты Google Maps.
        </p>
        <Button variant="primary" onClick={handleCreate}>
          + Добавить магазин
        </Button>
      </div>

      <div className={styles.slidesList}>
        {stores.length === 0 && !editingStore && (
          <p style={{ color: 'var(--color-text-secondary)' }}>Магазины не добавлены</p>
        )}

        {stores.map((store) => (
          <div key={store.id} className={styles.slideItem}>
            <div className={styles.slidePreview}>
              <div className={styles.slideInfo}>
                <h4>{store.address}</h4>
                <div className={styles.slideMeta}>
                  <span>Порядок: {store.order}</span>
                  <span className={store.isActive ? styles.active : styles.inactive}>
                    {store.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.slideActions}>
              <Button variant="outline" onClick={() => handleEdit(store)}>
                Редактировать
              </Button>
              <Button variant="outline" onClick={() => handleDelete(store.id)}>
                Удалить
              </Button>
            </div>
          </div>
        ))}

        {editingStore && (
          <div className={styles.slideEditor}>
            <h3 className={styles.subsectionTitle}>
              {isCreating ? 'Создание магазина' : 'Редактирование магазина'}
            </h3>
            <Input
              label="Адрес *"
              value={editingStore.address}
              onChange={(e) => setEditingStore({ ...editingStore, address: e.target.value })}
              placeholder="Красноярск, ул. Молокова 17"
              required
            />
            <Input
              label="URL карты Google Maps *"
              value={editingStore.mapUrl}
              onChange={(e) => setEditingStore({ ...editingStore, mapUrl: e.target.value })}
              placeholder="https://www.google.com/maps/embed?pb=..."
              required
            />
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px', marginBottom: '16px' }}>
              Чтобы получить URL карты: откройте Google Maps, найдите адрес, нажмите «Поделиться» → «Встроить карту» → скопируйте src из iframe
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <Input
                label="Порядок сортировки"
                type="number"
                value={editingStore.order}
                onChange={(e) => setEditingStore({ ...editingStore, order: parseInt(e.target.value) || 0 })}
              />
              <div className={styles.checkbox} style={{ marginTop: '24px' }}>
                <input
                  type="checkbox"
                  id="storeActive"
                  checked={editingStore.isActive}
                  onChange={(e) => setEditingStore({ ...editingStore, isActive: e.target.checked })}
                />
                <label htmlFor="storeActive">Активен</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <Button variant="primary" onClick={handleSaveStore}>
                Сохранить
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingStore(null)
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
