'use client'

import { useState, useEffect } from 'react'
import styles from './CouponsManager.module.scss'

interface Coupon {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  minAmount?: number | null
  maxDiscount?: number | null
  usageLimit?: number | null
  usedCount: number
  isActive: boolean
  validFrom?: string | null
  validUntil?: string | null
  description?: string | null
  createdAt: string
  updatedAt: string
}

export function CouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 0,
    minAmount: '',
    maxDiscount: '',
    usageLimit: '',
    isActive: true,
    validFrom: '',
    validUntil: '',
    description: '',
  })

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons')
      const data = await response.json()
      if (data.success) {
        setCoupons(data.data.map((c: any) => ({
          ...c,
          value: parseFloat(c.value),
          minAmount: c.minAmount ? parseFloat(c.minAmount) : null,
          maxDiscount: c.maxDiscount ? parseFloat(c.maxDiscount) : null,
        })))
      }
    } catch (error) {
      console.error('Error loading coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = {
        code: formData.code,
        type: formData.type,
        value: formData.value,
        isActive: formData.isActive,
      }

      if (formData.minAmount) payload.minAmount = parseFloat(formData.minAmount)
      if (formData.maxDiscount) payload.maxDiscount = parseFloat(formData.maxDiscount)
      if (formData.usageLimit) payload.usageLimit = parseInt(formData.usageLimit)
      if (formData.validFrom) payload.validFrom = new Date(formData.validFrom).toISOString()
      if (formData.validUntil) payload.validUntil = new Date(formData.validUntil).toISOString()
      if (formData.description) payload.description = formData.description

      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : '/api/admin/coupons'
      const method = editingCoupon ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (data.success) {
        await loadCoupons()
        handleCancel()
        alert(editingCoupon ? 'Купон обновлен' : 'Купон создан')
      } else {
        alert(data.error || 'Ошибка')
      }
    } catch (error) {
      console.error('Error saving coupon:', error)
      alert('Ошибка при сохранении купона')
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      isActive: coupon.isActive,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 16) : '',
      description: coupon.description || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить купон?')) return

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        await loadCoupons()
        alert('Купон удален')
      } else {
        alert(data.error || 'Ошибка')
      }
    } catch (error) {
      console.error('Error deleting coupon:', error)
      alert('Ошибка при удалении купона')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCoupon(null)
    setFormData({
      code: '',
      type: 'PERCENTAGE',
      value: 0,
      minAmount: '',
      maxDiscount: '',
      usageLimit: '',
      isActive: true,
      validFrom: '',
      validUntil: '',
      description: '',
    })
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className={styles.couponsManager}>
      <div className={styles.header}>
        <h2>Управление купонами</h2>
        <button onClick={() => setShowForm(true)} className={styles.addButton}>
          + Добавить купон
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <h3>{editingCoupon ? 'Редактировать купон' : 'Новый купон'}</h3>
          
          <div className={styles.formRow}>
            <label>
              Код купона *
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                placeholder="PROMO10"
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Тип скидки *
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                required
              >
                <option value="PERCENTAGE">Процентная (%)</option>
                <option value="FIXED">Фиксированная (₽)</option>
              </select>
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Значение *
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                required
                min="0"
                step={formData.type === 'PERCENTAGE' ? '1' : '0.01'}
                placeholder={formData.type === 'PERCENTAGE' ? '10' : '100'}
              />
              <span className={styles.hint}>
                {formData.type === 'PERCENTAGE' ? 'Процент скидки (0-100)' : 'Сумма скидки в рублях'}
              </span>
            </label>
          </div>

          {formData.type === 'PERCENTAGE' && (
            <div className={styles.formRow}>
              <label>
                Максимальная скидка (₽)
                <input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  min="0"
                  step="0.01"
                  placeholder="Не ограничено"
                />
                <span className={styles.hint}>Ограничивает максимальную сумму скидки</span>
              </label>
            </div>
          )}

          <div className={styles.formRow}>
            <label>
              Минимальная сумма заказа (₽)
              <input
                type="number"
                value={formData.minAmount}
                onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                min="0"
                step="0.01"
                placeholder="Не ограничено"
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Лимит использований
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                min="1"
                placeholder="Не ограничено"
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Действителен с
              <input
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Действителен до
              <input
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Описание
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Описание купона"
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Активен
            </label>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.saveButton}>
              {editingCoupon ? 'Сохранить' : 'Создать'}
            </button>
            <button type="button" onClick={handleCancel} className={styles.cancelButton}>
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Код</th>
              <th>Тип</th>
              <th>Значение</th>
              <th>Использовано</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                  Нет купонов
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td><strong>{coupon.code}</strong></td>
                  <td>{coupon.type === 'PERCENTAGE' ? 'Процентная' : 'Фиксированная'}</td>
                  <td>
                    {coupon.type === 'PERCENTAGE' 
                      ? `${coupon.value}%${coupon.maxDiscount ? ` (макс. ${coupon.maxDiscount} ₽)` : ''}`
                      : `${coupon.value} ₽`}
                  </td>
                  <td>
                    {coupon.usedCount}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                  </td>
                  <td>
                    <span className={coupon.isActive ? styles.active : styles.inactive}>
                      {coupon.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(coupon)} className={styles.editButton}>
                      Редактировать
                    </button>
                    <button onClick={() => handleDelete(coupon.id)} className={styles.deleteButton}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

