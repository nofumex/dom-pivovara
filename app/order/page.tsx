'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart-store'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from './page.module.scss'

type DeliveryType = 'PICKUP' | 'COURIER' | 'TRANSPORT'
type PaymentMethod = 'CARD' | 'CASH_COURIER' | 'CASH_PICKUP'

interface OrderFormData {
  // Шаг 1: Регион и тип плательщика
  payerType: 'INDIVIDUAL' | 'LEGAL'
  location: string
  zipCode: string
  
  // Шаг 2: Доставка
  deliveryType: DeliveryType
  deliveryAddress: string
  
  // Шаг 3: Оплата
  paymentMethod: PaymentMethod
  
  // Шаг 4: Покупатель
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  notes: string
  
  // Купон
  couponCode: string
}

export default function OrderPage() {
  const router = useRouter()
  const cartItems = useCartStore((state) => state.items)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const clearCart = useCartStore((state) => state.clearCart)

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<OrderFormData>({
    payerType: 'INDIVIDUAL',
    location: '',
    zipCode: '',
    deliveryType: 'COURIER',
    deliveryAddress: '',
    paymentMethod: 'CARD',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    couponCode: '',
  })

  const subtotal = getTotalPrice()
  const deliveryCost = formData.deliveryType === 'PICKUP' ? 0 : 300
  const discount = 0 // TODO: реализовать купоны
  const total = subtotal + deliveryCost - discount

  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/cart')
    }
  }, [cartItems, router])

  const updateFormData = (field: keyof OrderFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    // Валидация в зависимости от шага
    if (currentStep === 1) {
      if (!formData.location || !formData.zipCode) {
        alert('Заполните все обязательные поля')
        return
      }
    }
    if (currentStep === 4) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address) {
        alert('Заполните все обязательные поля')
        return
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
        })),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        company: formData.payerType === 'LEGAL' ? formData.location : undefined,
        deliveryType: formData.deliveryType,
        notes: formData.notes,
        promoCode: formData.couponCode || undefined,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (data.success) {
        clearCart()
        router.push(`/order/success?orderNumber=${data.data.orderNumber}`)
      } else {
        alert(data.error || 'Ошибка при оформлении заказа')
      }
    } catch (error) {
      console.error('Order submission error:', error)
      alert('Ошибка при оформлении заказа')
    } finally {
      setIsSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Оформление заказа', href: '/order' },
  ]

  return (
    <main className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Оформление заказа</h1>

        <div className={styles.content}>
          <div className={styles.formSection}>
            {/* Шаг 1: Регион доставки */}
            {currentStep === 1 && (
              <div className={styles.step}>
                <h2 className={styles.stepTitle}>Регион доставки</h2>
                <div className={styles.payerType}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="payerType"
                      value="INDIVIDUAL"
                      checked={formData.payerType === 'INDIVIDUAL'}
                      onChange={(e) => updateFormData('payerType', e.target.value)}
                    />
                    <span>Физическое лицо</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="payerType"
                      value="LEGAL"
                      checked={formData.payerType === 'LEGAL'}
                      onChange={(e) => updateFormData('payerType', e.target.value)}
                    />
                    <span>Юридическое лицо</span>
                  </label>
                </div>
                <Input
                  label="* Местоположение"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  placeholder="Введите название ..."
                  required
                />
                <Input
                  label="* Индекс"
                  value={formData.zipCode}
                  onChange={(e) => updateFormData('zipCode', e.target.value)}
                  placeholder="101000"
                  required
                />
                <p className={styles.hint}>
                  Выберите свой город в списке. Если вы не нашли свой город, выберите "другое местоположение", а город впишите в поле "Город"
                </p>
              </div>
            )}

            {/* Шаг 2: Доставка */}
            {currentStep === 2 && (
              <div className={styles.step}>
                <h2 className={styles.stepTitle}>Доставка</h2>
                <div className={styles.deliveryOptions}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="deliveryType"
                      value="COURIER"
                      checked={formData.deliveryType === 'COURIER'}
                      onChange={(e) => updateFormData('deliveryType', e.target.value as DeliveryType)}
                    />
                    <div>
                      <span className={styles.deliveryPrice}>300 ₽</span>
                      <span>Доставка курьером</span>
                      <p className={styles.deliveryDescription}>
                        Доставка осуществляется в течение дня в удобное для вас время.
                        <br />
                        Стоимость: 300 ₽
                        <br />
                        Срок доставки: до 2 дней
                      </p>
                    </div>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="deliveryType"
                      value="PICKUP"
                      checked={formData.deliveryType === 'PICKUP'}
                      onChange={(e) => updateFormData('deliveryType', e.target.value as DeliveryType)}
                    />
                    <div>
                      <span className={styles.deliveryPrice}>0 ₽</span>
                      <span>Самовывоз Семафорная 271, стр. 7</span>
                    </div>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="deliveryType"
                      value="PICKUP"
                      checked={formData.deliveryType === 'PICKUP'}
                      onChange={(e) => updateFormData('deliveryType', e.target.value as DeliveryType)}
                    />
                    <div>
                      <span className={styles.deliveryPrice}>0 ₽</span>
                      <span>Самовывоз Молокова 17</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Шаг 3: Оплата */}
            {currentStep === 3 && (
              <div className={styles.step}>
                <h2 className={styles.stepTitle}>Оплата</h2>
                <div className={styles.paymentOptions}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CARD"
                      checked={formData.paymentMethod === 'CARD'}
                      onChange={(e) => updateFormData('paymentMethod', e.target.value as PaymentMethod)}
                    />
                    <div>
                      <span>Банковские карты</span>
                      <p className={styles.paymentDescription}>
                        Оплата производится банковской картой, через терминал магазина.
                      </p>
                    </div>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH_COURIER"
                      checked={formData.paymentMethod === 'CASH_COURIER'}
                      onChange={(e) => updateFormData('paymentMethod', e.target.value as PaymentMethod)}
                    />
                    <span>Наличные курьеру</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH_PICKUP"
                      checked={formData.paymentMethod === 'CASH_PICKUP'}
                      onChange={(e) => updateFormData('paymentMethod', e.target.value as PaymentMethod)}
                    />
                    <span>Наличный расчет</span>
                  </label>
                </div>
              </div>
            )}

            {/* Шаг 4: Покупатель */}
            {currentStep === 4 && (
              <div className={styles.step}>
                <h2 className={styles.stepTitle}>Покупатель</h2>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <Input
                    label="* Имя"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    placeholder="Иван"
                    required
                  />
                  <Input
                    label="* Фамилия"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    placeholder="Иванов"
                    required
                  />
                </div>
                <Input
                  label="* E-Mail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  required
                />
                <Input
                  label="* Телефон"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  required
                />
                <Input
                  label="* Адрес доставки"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  required
                />
                <Input
                  label="Комментарии к заказу:"
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  multiline
                  rows={4}
                />
              </div>
            )}

            {/* Шаг 5: Подтверждение */}
            {currentStep === 5 && (
              <div className={styles.step}>
                <h2 className={styles.stepTitle}>Подтверждение заказа</h2>
                <div className={styles.confirmation}>
                  <p>Проверьте данные заказа перед оформлением</p>
                  <div className={styles.orderSummary}>
                    <div className={styles.summaryRow}>
                      <span>Товаров на:</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Доставка:</span>
                      <span>{formatPrice(deliveryCost)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Итого:</span>
                      <span className={styles.total}>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.stepActions}>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  Назад
                </Button>
              )}
              {currentStep < 5 ? (
                <Button variant="primary" onClick={handleNext}>
                  Далее
                </Button>
              ) : (
                <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Оформление...' : 'Оформить заказ'}
                </Button>
              )}
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.orderSummary}>
              <h3 className={styles.sidebarTitle}>Товары в заказе</h3>
              <div className={styles.orderItems}>
                {cartItems.map((item) => (
                  <div key={item.id} className={styles.orderItem}>
                    <div className={styles.orderItemInfo}>
                      <span className={styles.orderItemName}>{item.product.title}</span>
                      <div className={styles.orderItemDetails}>
                        <span>0%</span>
                        <span>{formatPrice(item.price)}</span>
                        <span>Розничная цена</span>
                        <span>0 кг</span>
                        <span>{item.quantity} шт</span>
                        <span className={styles.orderItemTotal}>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.orderTotal}>
                <div className={styles.totalRow}>
                  <span>Товаров на:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Доставка:</span>
                  <span>{formatPrice(deliveryCost)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Итого:</span>
                  <span className={styles.finalTotal}>{formatPrice(total)}</span>
                </div>
              </div>
              {currentStep === 5 && (
                <div className={styles.couponSection}>
                  <Input
                    label="Применить купон:"
                    value={formData.couponCode}
                    onChange={(e) => updateFormData('couponCode', e.target.value)}
                    placeholder="Введите код купона"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

