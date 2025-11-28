'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { ProductVariantsManager } from '@/components/admin/ProductVariantsManager/ProductVariantsManager'
import styles from './EditProductForm.module.scss'

interface EditProductFormProps {
  product: any
  categories: any[]
}

export function EditProductForm({ product, categories }: EditProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [variants, setVariants] = useState(product.variants || [])
  const [images, setImages] = useState<string[]>(product.images || [])
  const [formData, setFormData] = useState({
    title: product.title || '',
    sku: product.sku || '',
    slug: product.slug || '',
    description: product.description || '',
    content: product.content || '',
    price: product.price?.toString() || '0',
    oldPrice: product.oldPrice?.toString() || '',
    stock: product.stock?.toString() || '0',
    minOrder: product.minOrder?.toString() || '1',
    weight: product.weight?.toString() || '',
    dimensions: product.dimensions || '',
    material: product.material || '',
    category: product.category || 'ECONOMY',
    categoryId: product.categoryId || '',
    tags: product.tags?.join(', ') || '',
    isActive: product.isActive ?? true,
    isFeatured: product.isFeatured ?? false,
    isInStock: product.isInStock ?? true,
    visibility: product.visibility || 'VISIBLE',
    seoTitle: product.seoTitle || '',
    seoDesc: product.seoDesc || '',
    metaTitle: product.metaTitle || '',
    metaDesc: product.metaDesc || '',
  })

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setImages([...images, data.data.url])
      } else {
        alert('Ошибка при загрузке изображения')
      }
    } catch (error) {
      alert('Ошибка при загрузке изображения')
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const response = await fetch(`/api/admin/products/${product.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : undefined,
          stock: parseInt(formData.stock),
          minOrder: parseInt(formData.minOrder),
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          tags: tagsArray,
          images,
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
        credentials: 'include',
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

  // Save variants when they change
  useEffect(() => {
    const saveVariants = async () => {
      // Variants will be saved separately via API
    }
  }, [variants])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Редактировать товар</h1>
        <div className={styles.headerActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
          >
            Удалить
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Основная информация</h2>
            <div className={styles.formFields}>
              <Input
                label="Название *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Input
                label="Артикул (SKU) *"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
              <Input
                label="Slug *"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
              <div>
                <label>Категория *</label>
                <Select
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
              </div>
              <div>
                <label>Класс товара *</label>
                <Select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as 'ECONOMY' | 'MIDDLE' | 'LUXURY',
                    })
                  }
                >
                  <option value="ECONOMY">Эконом</option>
                  <option value="MIDDLE">Средний</option>
                  <option value="LUXURY">Премиум</option>
                </Select>
              </div>
              <Input
                label="Описание"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                type="textarea"
              />
              <Input
                label="Полное описание"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                type="textarea"
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Цена и остаток</h2>
            <div className={styles.formFields}>
              <Input
                label="Цена *"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
              <Input
                label="Старая цена"
                type="number"
                step="0.01"
                value={formData.oldPrice}
                onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
              />
              <Input
                label="Остаток *"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
              <Input
                label="Минимальный заказ"
                type="number"
                value={formData.minOrder}
                onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                min="1"
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Дополнительная информация</h2>
            <div className={styles.formFields}>
              <Input
                label="Вес (кг)"
                type="number"
                step="0.001"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
              <Input
                label="Габариты"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                placeholder="10x20x30 см"
              />
              <Input
                label="Материал"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              />
              <Input
                label="Теги (через запятую)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="новинка, хит, распродажа"
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Изображения</h2>
            <div className={styles.imageUpload}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  files.forEach((file) => handleImageUpload(file))
                }}
                className={styles.fileInput}
              />
              <div className={styles.imagesList}>
                {images.map((url, index) => (
                  <div key={index} className={styles.imageItem}>
                    <img src={url} alt={`Image ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className={styles.removeImage}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Настройки</h2>
            <div className={styles.formFields}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Активен
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                />
                Рекомендуемый
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isInStock}
                  onChange={(e) => setFormData({ ...formData, isInStock: e.target.checked })}
                />
                В наличии
              </label>
              <div>
                <label>Видимость</label>
                <Select
                  value={formData.visibility}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visibility: e.target.value as 'VISIBLE' | 'HIDDEN' | 'DRAFT',
                    })
                  }
                >
                  <option value="VISIBLE">Видимый</option>
                  <option value="HIDDEN">Скрытый</option>
                  <option value="DRAFT">Черновик</option>
                </Select>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>SEO настройки</h2>
            <div className={styles.formFields}>
              <Input
                label="SEO заголовок"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              />
              <Input
                label="SEO описание"
                value={formData.seoDesc}
                onChange={(e) => setFormData({ ...formData, seoDesc: e.target.value })}
                type="textarea"
              />
              <Input
                label="Meta заголовок"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              />
              <Input
                label="Meta описание"
                value={formData.metaDesc}
                onChange={(e) => setFormData({ ...formData, metaDesc: e.target.value })}
                type="textarea"
              />
            </div>
          </div>
        </div>

        <ProductVariantsManager
          variants={variants}
          productPrice={parseFloat(formData.price) || 0}
          onVariantsChange={async (newVariants) => {
            setVariants(newVariants)
            // Save variants to API
            for (const variant of newVariants) {
              if (!variant.id) {
                // New variant - create
                try {
                  const response = await fetch(
                    `/api/admin/products/${product.slug}/variants`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(variant),
                    }
                  )
                  const data = await response.json()
                  if (data.success) {
                    variant.id = data.data.id
                  }
                } catch (error) {
                  console.error('Error creating variant:', error)
                }
              } else {
                // Existing variant - update
                try {
                  await fetch(
                    `/api/admin/products/${product.slug}/variants/${variant.id}`,
                    {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(variant),
                    }
                  )
                } catch (error) {
                  console.error('Error updating variant:', error)
                }
              }
            }
          }}
        />

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
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
