'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import styles from './EditProductForm.module.scss'

interface EditProductFormProps {
  product: any
  categories: any[]
}

export function EditProductForm({ product, categories }: EditProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: product.title || '',
    sku: product.sku || '',
    slug: product.slug || '',
    description: product.description || '',
    price: product.price?.toString() || '0',
    stock: product.stock?.toString() || '0',
    categoryId: product.categoryId || '',
    isActive: product.isActive ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/products/${product.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
        }),
      })

      const data = await response.json()
      if (data.success) {
        router.push('/admin/products')
      } else {
        alert(data.error || 'Ошибка при обновлении товара')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Ошибка при обновлении товара')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${product.slug}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        router.push('/admin/products')
      } else {
        alert(data.error || 'Ошибка при удалении товара')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Ошибка при удалении товара')
    }
  }

  return (
    <div className={styles.page}>
      <h1>Редактировать товар</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Название"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <Input
          label="Артикул (SKU)"
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          required
        />
        <Input
          label="Slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          required
        />
        <Input
          label="Описание"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <Input
          label="Цена"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />
        <Input
          label="Остаток"
          type="number"
          value={formData.stock}
          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
          required
        />
        <Select
          label="Категория"
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          required
        >
          <option value="">Выберите категорию</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          <span>Активен</span>
        </label>
        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
          >
            Удалить
          </Button>
        </div>
      </form>
    </div>
  )
}

