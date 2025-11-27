'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { ProductVariantsManager } from '@/components/admin/ProductVariantsManager/ProductVariantsManager'
import styles from './page.module.scss'

interface Category {
  id: string
  name: string
}

interface Variant {
  id?: string
  size?: string
  color?: string
  material?: string
  price: number
  stock: number
  sku: string
  imageUrl?: string
  isActive: boolean
}

export default function CreateProductPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    slug: '',
    description: '',
    content: '',
    price: '',
    oldPrice: '',
    stock: '0',
    minOrder: '1',
    weight: '',
    dimensions: '',
    material: '',
    category: 'ECONOMY' as 'ECONOMY' | 'MIDDLE' | 'LUXURY',
    categoryId: '',
    tags: '',
    isActive: true,
    isFeatured: false,
    isInStock: true,
    visibility: 'VISIBLE' as 'VISIBLE' | 'HIDDEN' | 'DRAFT',
    seoTitle: '',
    seoDesc: '',
    metaTitle: '',
    metaDesc: '',
  })

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data)
        }
      })
  }, [])

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

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : undefined,
          stock: parseInt(formData.stock),
          minOrder: parseInt(formData.minOrder),
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          tags: tagsArray,
          images,
          variants,
        }),
      })

      const data = await response.json()
      if (data.success) {
        router.push('/admin/products')
      } else {
        alert(data.error || 'Ошибка при создании товара')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Ошибка при создании товара')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Создать товар</h1>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Отмена
        </Button>
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
          onVariantsChange={setVariants}
        />

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Создание...' : 'Создать товар'}
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
