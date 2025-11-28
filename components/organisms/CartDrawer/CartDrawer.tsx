'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart-store'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/atoms/Button/Button'
import { CheckoutModal } from '@/components/molecules/CheckoutModal/CheckoutModal'
import styles from './CartDrawer.module.scss'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter()
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)

  if (!isOpen) return null

  const subtotal = getTotalPrice()
  const discount = 0
  const total = subtotal - discount

  const handleGoToCart = () => {
    router.push('/cart')
    onClose()
  }

  const handleCheckout = () => {
    router.push('/order')
    onClose()
  }

  const handleCheckoutSuccess = (orderNumber: string) => {
    alert(`Заказ оформлен! Номер заказа: ${orderNumber}`)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Корзина</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className={styles.content}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <p>Корзина пуста</p>
            </div>
          ) : (
            <>
              <div className={styles.items}>
                {items.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <div
                      className={styles.itemImage}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    />
                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemTitle}>{item.product.title}</h4>
                      <p className={styles.itemPrice}>{formatPrice(item.price)}</p>
                      <div className={styles.itemQuantity}>
                        <button
                          className={styles.quantityButton}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className={styles.quantityValue}>{item.quantity}</span>
                        <button
                          className={styles.quantityButton}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
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

              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span>Подытог:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Скидка:</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className={`${styles.summaryRow} ${styles.total}`}>
                  <span>Итого:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className={styles.actions}>
                <Button variant="outline" onClick={onClose}>
                  Продолжить покупки
                </Button>
                <Button variant="outline" onClick={handleGoToCart}>
                  Перейти в корзину
                </Button>
                <Button variant="primary" onClick={handleCheckout}>
                  Полноценное оформление заказа
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  )
}

