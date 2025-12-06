'use client'

import { useState } from 'react'
import styles from './ProductVariantsManager.module.scss'

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

interface ProductVariantsManagerProps {
  variants: Variant[]
  productPrice: number
  onVariantsChange: (variants: Variant[]) => void
}

export function ProductVariantsManager({
  variants: initialVariants,
  productPrice,
  onVariantsChange,
}: ProductVariantsManagerProps) {
  const [variants, setVariants] = useState<Variant[]>(initialVariants || [])
  const [isAdding, setIsAdding] = useState(false)
  const [newVariant, setNewVariant] = useState<Partial<Variant>>({
    price: productPrice,
    stock: 0,
    sku: '',
    isActive: true,
  })

  const handleAddVariant = () => {
    if (!newVariant.sku) {
      alert('SKU обязателен')
      return
    }
    if (variants.some((v) => v.sku === newVariant.sku)) {
      alert('Вариант с таким SKU уже существует')
      return
    }

    const variant: Variant = {
      size: newVariant.size || undefined,
      color: newVariant.color || undefined,
      material: newVariant.material || undefined,
      price: newVariant.price || productPrice,
      stock: newVariant.stock || 0,
      sku: newVariant.sku,
      imageUrl: newVariant.imageUrl || undefined,
      isActive: newVariant.isActive !== false,
    }

    const updated = [...variants, variant]
    setVariants(updated)
    onVariantsChange(updated)
    setNewVariant({
      price: productPrice,
      stock: 0,
      sku: '',
      isActive: true,
    })
    setIsAdding(false)
  }

  const handleRemoveVariant = (index: number) => {
    if (confirm('Удалить вариант?')) {
      const updated = variants.filter((_, i) => i !== index)
      setVariants(updated)
      onVariantsChange(updated)
    }
  }

  const handleUpdateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
    onVariantsChange(updated)
  }

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        handleUpdateVariant(index, 'imageUrl', data.data.url)
      } else {
        alert('Ошибка при загрузке изображения')
      }
    } catch (error) {
      alert('Ошибка при загрузке изображения')
      console.error(error)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Варианты товара</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={styles.addButton}
        >
          {isAdding ? 'Отмена' : '+ Добавить вариант'}
        </button>
      </div>

      {isAdding && (
        <div className={styles.addForm}>
          <div className={styles.formGrid}>
            <div>
              <label>SKU *</label>
              <input
                type="text"
                value={newVariant.sku || ''}
                onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                placeholder="VAR001"
                required
              />
            </div>
            <div>
              <label>Размер</label>
              <input
                type="text"
                value={newVariant.size || ''}
                onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                placeholder="L"
              />
            </div>
            <div>
              <label>Цвет</label>
              <input
                type="text"
                value={newVariant.color || ''}
                onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                placeholder="Красный"
              />
            </div>
            <div>
              <label>Материал</label>
              <input
                type="text"
                value={newVariant.material || ''}
                onChange={(e) => setNewVariant({ ...newVariant, material: e.target.value })}
                placeholder="Хлопок"
              />
            </div>
            <div>
              <label>Цена *</label>
              <input
                type="number"
                value={newVariant.price || productPrice}
                onChange={(e) =>
                  setNewVariant({ ...newVariant, price: parseFloat(e.target.value) })
                }
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label>Остаток *</label>
              <input
                type="number"
                value={newVariant.stock || 0}
                onChange={(e) =>
                  setNewVariant({ ...newVariant, stock: parseInt(e.target.value) })
                }
                min="0"
                required
              />
            </div>
            <div>
              <label>URL изображения</label>
              <input
                type="text"
                value={newVariant.imageUrl || ''}
                onChange={(e) => setNewVariant({ ...newVariant, imageUrl: e.target.value })}
                placeholder="/uploads/image.jpg"
              />
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={newVariant.isActive !== false}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, isActive: e.target.checked })
                  }
                />
                Активен
              </label>
            </div>
          </div>
          <button onClick={handleAddVariant} className={styles.saveButton}>
            Сохранить вариант
          </button>
        </div>
      )}

      {variants.length === 0 ? (
        <div className={styles.empty}>
          <p>Варианты не добавлены</p>
          <p className={styles.emptyHint}>
            Добавьте варианты для товара (размер, цвет, материал)
          </p>
        </div>
      ) : (
        <div className={styles.variantsList}>
          {variants.map((variant, index) => (
            <div key={index} className={styles.variantCard}>
              <div className={styles.variantHeader}>
                <div className={styles.variantInfo}>
                  <h4 className={styles.variantSku}>{variant.sku}</h4>
                  <div className={styles.variantAttributes}>
                    {variant.size && <span>Размер: {variant.size}</span>}
                    {variant.color && <span>Цвет: {variant.color}</span>}
                    {variant.material && <span>Материал: {variant.material}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveVariant(index)}
                  className={styles.removeButton}
                >
                  Удалить
                </button>
              </div>
              <div className={styles.variantDetails}>
                <div className={styles.variantField}>
                  <label>Цена</label>
                  <input
                    type="number"
                    value={variant.price}
                    onChange={(e) =>
                      handleUpdateVariant(index, 'price', parseFloat(e.target.value))
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className={styles.variantField}>
                  <label>Остаток</label>
                  <input
                    type="number"
                    value={variant.stock}
                    onChange={(e) =>
                      handleUpdateVariant(index, 'stock', parseInt(e.target.value))
                    }
                    min="0"
                  />
                </div>
                <div className={styles.variantField}>
                  <label>Изображение</label>
                  <div className={styles.imageUpload}>
                    <input
                      type="text"
                      value={variant.imageUrl || ''}
                      onChange={(e) =>
                        handleUpdateVariant(index, 'imageUrl', e.target.value)
                      }
                      placeholder="/uploads/image.jpg"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(index, file)
                      }}
                      className={styles.fileInput}
                    />
                  </div>
                  {variant.imageUrl && (
                    <img
                      src={variant.imageUrl}
                      alt="Variant"
                      className={styles.variantImage}
                    />
                  )}
                </div>
                <div className={styles.variantField}>
                  <label>
                    <input
                      type="checkbox"
                      checked={variant.isActive}
                      onChange={(e) =>
                        handleUpdateVariant(index, 'isActive', e.target.checked)
                      }
                    />
                    Активен
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}








