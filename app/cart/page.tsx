'use client'

import { useCartStore } from '@/store/cart-store'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/atoms/Button/Button'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'

export default function CartPage() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)

  const subtotal = getTotalPrice()
  const discount = 0
  const total = subtotal - discount

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Корзина', href: '/cart' },
  ]

  const handleOrder = () => {
    if (items.length === 0) {
      alert('Корзина пуста')
      return
    }
    router.push('/order')
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        
        <div className={styles.header}>
          <h1 className={styles.title}>Корзина</h1>
          {items.length > 0 && (
            <button className={styles.printButton} onClick={() => window.print()}>
              Распечатать
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>Корзина пуста</p>
            <Link href="/catalog">
              <Button variant="primary">Перейти в каталог</Button>
            </Link>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.couponSection}>
              <input
                type="text"
                placeholder="Введите код купона для скидки:"
                className={styles.couponInput}
              />
            </div>

            <div className={styles.summaryTop}>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>Итого:</span>
                <span className={styles.summaryValue}>{formatPrice(total)}</span>
              </div>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>Сумма НДС:</span>
                <span className={styles.summaryValue}>0 ₽</span>
              </div>
            </div>

            <div className={styles.cartSection}>
              <div className={styles.cartHeader}>
                <h2>В корзине {items.length} {items.length === 1 ? 'товар' : items.length < 5 ? 'товара' : 'товаров'}</h2>
                <button className={styles.clearButton} onClick={clearCart}>
                  Очистить
                </button>
              </div>

              <div className={styles.items}>
                {items.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <div className={styles.itemImage}>
                      {item.product.images && 
                       item.product.images.length > 0 && 
                       item.product.images[0] && 
                       !item.product.images[0].includes('placeholder') &&
                       item.product.images[0].trim() !== '' ? (
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.title}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const placeholder = target.parentElement?.querySelector(`.${styles.placeholderImage}`) as HTMLDivElement
                            if (placeholder) placeholder.style.display = 'block'
                          }}
                        />
                      ) : null}
                      <div 
                        className={styles.placeholderImage} 
                        style={{ 
                          display: (item.product.images && 
                                   item.product.images.length > 0 && 
                                   item.product.images[0] && 
                                   !item.product.images[0].includes('placeholder') &&
                                   item.product.images[0].trim() !== '') ? 'none' : 'block' 
                        }} 
                      />
                    </div>
                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemTitle}>{item.product.title}</h3>
                      <div className={styles.itemDetails}>
                        <div className={styles.priceInfo}>
                          <span className={styles.priceType}>Розничная цена</span>
                          <span className={styles.price}>{formatPrice(item.price)}</span>
                          <span className={styles.pricePerUnit}>цена за 1 шт</span>
                        </div>
                        <div className={styles.quantityControl}>
                          <button
                            className={styles.quantityButton}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span className={styles.quantity}>{item.quantity} шт</span>
                          <button
                            className={styles.quantityButton}
                            onClick={() => {
                              const availableStock = item.product.stock ?? 0
                              if (availableStock > 0 && item.quantity >= availableStock) {
                                alert(`Доступно только ${availableStock} шт.`)
                                return
                              }
                              updateQuantity(item.id, item.quantity + 1)
                            }}
                            disabled={item.product.stock !== undefined && item.product.stock > 0 && item.quantity >= item.product.stock}
                          >
                            +
                          </button>
                        </div>
                        <div className={styles.itemTotal}>
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeItem(item.id)}
                      aria-label="Удалить"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="primary" onClick={handleOrder}>
                Оформить заказ
              </Button>
            </div>
            <div className={styles.continueShopping}>
              <Link href="/catalog">
                <span className={styles.continueLink}>Продолжить покупки</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}






