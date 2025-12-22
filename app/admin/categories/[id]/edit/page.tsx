'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import styles from './page.module.scss'

interface Category {
  id: string
  name: string
  slug: string
}

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryId = params.id as string
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    isActive: true,
    sortOrder: 0,
    seoTitle: '',
    seoDesc: '',
  })
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/admin/categories/${categoryId}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }),
          fetch('/api/admin/categories', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }),
        ])

        if (!categoryResponse.ok) {
          const errorText = await categoryResponse.text()
          console.error('Failed to fetch category:', categoryResponse.status, errorText)
          alert('Ошибка загрузки категории. Проверьте консоль для деталей.')
          setLoadingData(false)
          return
        }

        const categoryData = await categoryResponse.json()
        const categoriesData = await categoriesResponse.json()

        console.log('Category data response:', categoryData)
        console.log('Categories data response:', categoriesData)

        if (categoryData.success && categoryData.data) {
          const cat = categoryData.data
          console.log('Setting form data with category:', cat)
          setFormData({
            name: cat.name || '',
            slug: cat.slug || '',
            description: cat.description || '',
            parentId: cat.parentId || '',
            isActive: cat.isActive ?? true,
            sortOrder: cat.sortOrder || 0,
            seoTitle: cat.seoTitle || '',
            seoDesc: cat.seoDesc || '',
          })
        } else {
          console.error('Category API error:', categoryData.error || categoryData.message, categoryData)
          alert(`Ошибка загрузки категории: ${categoryData.error || categoryData.message || 'Неизвестная ошибка'}`)
        }

        if (categoriesData.success && categoriesData.data) {
          setCategories(
            (categoriesData.data || []).filter((c: Category) => c.id !== categoryId)
          )
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    if (categoryId) {
      fetchData()
    }
  }, [categoryId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/categories')
      } else {
        alert(data.message || 'Ошибка при обновлении категории')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Ошибка при обновлении категории')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/categories')
      } else {
        alert(data.message || 'Ошибка при удалении категории')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Ошибка при удалении категории')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className={styles.page}>Загрузка...</div>
  }

  return (
    <div className={styles.page}>
      <h1>Редактировать категорию</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="name">Название *</label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="slug">Slug *</label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className={styles.textarea}
            rows={4}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="parentId">Родительская категория</label>
          <Select
            id="parentId"
            value={formData.parentId}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
          >
            <option value="">Нет</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.field}>
          <label htmlFor="sortOrder">Порядок сортировки</label>
          <Input
            id="sortOrder"
            type="number"
            value={formData.sortOrder}
            onChange={(e) =>
              setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
            }
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="seoTitle">SEO Title</label>
          <Input
            id="seoTitle"
            value={formData.seoTitle}
            onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="seoDesc">SEO Description</label>
          <textarea
            id="seoDesc"
            value={formData.seoDesc}
            onChange={(e) =>
              setFormData({ ...formData, seoDesc: e.target.value })
            }
            className={styles.textarea}
            rows={3}
          />
        </div>

        <div className={styles.field}>
          <label>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
            />
            Активна
          </label>
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
          >
            Удалить
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Отмена
          </Button>
        </div>
      </form>
    </div>
  )
}





















