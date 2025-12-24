'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart-store'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import styles from './page.module.scss'

type DeliveryType = 'PICKUP' | 'PICKUP_SEMAFORNAYA' | 'PICKUP_MOLOKOVA' | 'COURIER' | 'TRANSPORT'
type PaymentMethod = 'CARD' | 'CASH_COURIER' | 'CASH_PICKUP'

interface OrderFormData {
  // Шаг 1: Регион и тип плательщика
  payerType: 'INDIVIDUAL' | 'LEGAL'
  location: string
  zipCode: string
  
  // Шаг 2: Доставка
  deliveryType: DeliveryType
  deliveryAddress: string
  pickupLocation?: string // Пункт самовывоза
  
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
  const [mounted, setMounted] = useState(false)
  const cartItems = useCartStore((state) => state.items)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const clearCart = useCartStore((state) => state.clearCart)

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [formData, setFormData] = useState<OrderFormData>({
    payerType: 'INDIVIDUAL',
    location: '',
    zipCode: '',
    deliveryType: 'PICKUP_SEMAFORNAYA', // По умолчанию самовывоз
    deliveryAddress: '',
    pickupLocation: undefined,
    paymentMethod: 'CARD',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    couponCode: '',
  })

  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponError, setCouponError] = useState<string>('')

  const subtotal = mounted ? getTotalPrice() : 0
  const deliveryCost = formData.deliveryType === 'PICKUP' || formData.deliveryType === 'PICKUP_SEMAFORNAYA' || formData.deliveryType === 'PICKUP_MOLOKOVA' ? 0 : 300
  const discount = appliedCoupon ? appliedCoupon.discount : 0
  const total = subtotal + deliveryCost - discount

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Не редиректим на /cart если заказ успешно создан
    if (mounted && cartItems.length === 0 && !orderSubmitted) {
      router.push('/cart')
    }
  }, [mounted, cartItems, router, orderSubmitted])

  const updateFormData = (field: keyof OrderFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyCoupon = async () => {
    if (!formData.couponCode.trim()) {
      setCouponError('Введите код купона')
      return
    }

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.couponCode,
          amount: subtotal + deliveryCost,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setAppliedCoupon({
          code: data.data.coupon.code,
          discount: data.data.discount,
        })
        setCouponError('')
      } else {
        setAppliedCoupon(null)
        // Более понятные сообщения об ошибках
        if (data.error?.includes('не найден')) {
          setCouponError('Купон с таким кодом не найден')
        } else if (data.error?.includes('неактивен')) {
          setCouponError('Этот купон неактивен')
        } else if (data.error?.includes('истек')) {
          setCouponError('Срок действия купона истек')
        } else if (data.error?.includes('исчерпан')) {
          setCouponError('Лимит использований купона исчерпан')
        } else if (data.error?.includes('Минимальная сумма')) {
          setCouponError(data.error)
        } else {
          setCouponError(data.error || 'Купон не найден')
        }
      }
    } catch (error) {
      console.error('Error applying coupon:', error)
      setCouponError('Купон с таким кодом не найден')
    }
  }

  const handleNext = () => {
    // Валидация в зависимости от шага
    if (currentStep === 1) {
      // Шаг 1 - выбор доставки, валидация не нужна (всегда что-то выбрано)
      // Можно перейти дальше
    }
    if (currentStep === 2) {
      // Шаг 2 - регион доставки
      const isPickup = formData.deliveryType === 'PICKUP' || 
                      formData.deliveryType === 'PICKUP_SEMAFORNAYA' || 
                      formData.deliveryType === 'PICKUP_MOLOKOVA'
      
      // Для самовывоза регион не обязателен, для доставки - обязателен
      if (!isPickup && (!formData.location || !formData.zipCode)) {
        alert('Заполните все обязательные поля')
        return
      }
    }
    if (currentStep === 4) {
      // Базовые поля всегда обязательны
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        alert('Заполните все обязательные поля')
        return
      }
      
      // Адрес обязателен только для доставки (не для самовывоза)
      const isPickup = formData.deliveryType === 'PICKUP' || 
                      formData.deliveryType === 'PICKUP_SEMAFORNAYA' || 
                      formData.deliveryType === 'PICKUP_MOLOKOVA'
      
      if (!isPickup && !formData.address) {
        alert('Заполните адрес доставки')
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
      // Преобразуем deliveryType перед отправкой
      let deliveryType: 'PICKUP' | 'COURIER' | 'TRANSPORT' = 'PICKUP'
      let pickupNote = ''
      
      if (formData.deliveryType === 'PICKUP_SEMAFORNAYA') {
        deliveryType = 'PICKUP'
        pickupNote = '\nПункт самовывоза: Семафорная 271, стр. 7'
      } else if (formData.deliveryType === 'PICKUP_MOLOKOVA') {
        deliveryType = 'PICKUP'
        pickupNote = '\nПункт самовывоза: Молокова 17'
      } else if (formData.deliveryType === 'COURIER') {
        deliveryType = 'COURIER'
      } else if (formData.deliveryType === 'TRANSPORT') {
        deliveryType = 'TRANSPORT'
      }

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
        deliveryType: deliveryType,
        notes: (formData.notes || '') + pickupNote,
        promoCode: appliedCoupon ? appliedCoupon.code : formData.couponCode || undefined,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (data.success) {
        setOrderSubmitted(true) // Устанавливаем флаг перед очисткой корзины
        clearCart()
        // Используем window.location для надежного редиректа
        window.location.href = `/order/success?orderNumber=${data.data.orderNumber}`
      } else {
        console.error('Order submission error:', data)
        const errorMessage = data.details || data.error || 'Ошибка при оформлении заказа'
        alert(errorMessage)
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
            {/* Шаг 1: Доставка (первый шаг - выбор типа доставки) */}
            {currentStep === 1 && (
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
                      value="PICKUP_SEMAFORNAYA"
                      checked={formData.deliveryType === 'PICKUP_SEMAFORNAYA'}
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
                      value="PICKUP_MOLOKOVA"
                      checked={formData.deliveryType === 'PICKUP_MOLOKOVA'}
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

            {/* Шаг 2: Регион доставки (показываем только если не самовывоз) */}
            {currentStep === 2 && (
              <div className={styles.step}>
                {(() => {
                  const isPickup = formData.deliveryType === 'PICKUP' || 
                                  formData.deliveryType === 'PICKUP_SEMAFORNAYA' || 
                                  formData.deliveryType === 'PICKUP_MOLOKOVA'
                  
                  if (isPickup) {
                    // Для самовывоза регион необязателен
                    return (
                      <>
                        <h2 className={styles.stepTitle}>Регион (необязательно)</h2>
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
                        <p className={styles.hint}>
                          Для самовывоза регион не обязателен. Вы можете указать его для статистики или пропустить этот шаг.
                        </p>
                        <Input
                          label="Местоположение (необязательно)"
                          value={formData.location}
                          onChange={(e) => updateFormData('location', e.target.value)}
                          placeholder="Введите название ..."
                        />
                        <Input
                          label="Индекс (необязательно)"
                          value={formData.zipCode}
                          onChange={(e) => updateFormData('zipCode', e.target.value)}
                          placeholder="101000"
                        />
                      </>
                    )
                  }
                  
                  return (
                    <>
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
                        Выберите свой город в списке. Если вы не нашли свой город, выберите &quot;другое местоположение&quot;, а город впишите в поле &quot;Город&quot;
                      </p>
                    </>
                  )
                })()}
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
                {(() => {
                  const isPickup = formData.deliveryType === 'PICKUP' || 
                                  formData.deliveryType === 'PICKUP_SEMAFORNAYA' || 
                                  formData.deliveryType === 'PICKUP_MOLOKOVA'
                  
                  if (!isPickup) {
                    return (
                      <Input
                        label="* Адрес доставки"
                        value={formData.address}
                        onChange={(e) => updateFormData('address', e.target.value)}
                        placeholder="Улица, дом, квартира"
                        required
                      />
                    )
                  }
                  return null
                })()}
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
                  
                  <div className={styles.confirmationSection}>
                    <h3 className={styles.confirmationSectionTitle}>Данные покупателя</h3>
                    <div className={styles.confirmationDetails}>
                      <div className={styles.confirmationRow}>
                        <span className={styles.confirmationLabel}>Тип плательщика:</span>
                        <span>{formData.payerType === 'INDIVIDUAL' ? 'Физическое лицо' : 'Юридическое лицо'}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span className={styles.confirmationLabel}>Имя:</span>
                        <span>{formData.firstName}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span className={styles.confirmationLabel}>Фамилия:</span>
                        <span>{formData.lastName}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span className={styles.confirmationLabel}>Email:</span>
                        <span>{formData.email}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span className={styles.confirmationLabel}>Телефон:</span>
                        <span>{formData.phone}</span>
                      </div>
                      {(formData.location || formData.zipCode) && (
                        <>
                          {formData.location && (
                            <div className={styles.confirmationRow}>
                              <span className={styles.confirmationLabel}>Местоположение:</span>
                              <span>{formData.location}</span>
                            </div>
                          )}
                          {formData.zipCode && (
                            <div className={styles.confirmationRow}>
                              <span className={styles.confirmationLabel}>Индекс:</span>
                              <span>{formData.zipCode}</span>
                            </div>
                          )}
                        </>
                      )}
                      {(() => {
                        const isPickup = formData.deliveryType === 'PICKUP' || 
                                        formData.deliveryType === 'PICKUP_SEMAFORNAYA' || 
                                        formData.deliveryType === 'PICKUP_MOLOKOVA'
                        
                        if (!isPickup && formData.address) {
                          return (
                            <div className={styles.confirmationRow}>
                              <span className={styles.confirmationLabel}>Адрес доставки:</span>
                              <span>{formData.address}</span>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>

                  <div className={styles.confirmationSection}>
                    <h3 className={styles.confirmationSectionTitle}>Способ доставки</h3>
                    <div className={styles.confirmationDetails}>
                      <div className={styles.confirmationRow}>
                        <span className={styles.confirmationLabel}>Тип доставки:</span>
                        <span>
                          {formData.deliveryType === 'COURIER' && 'Доставка курьером (300 ₽)'}
                          {formData.deliveryType === 'PICKUP_SEMAFORNAYA' && 'Самовывоз: Семафорная 271, стр. 7 (0 ₽)'}
                          {formData.deliveryType === 'PICKUP_MOLOKOVA' && 'Самовывоз: Молокова 17 (0 ₽)'}
                          {formData.deliveryType === 'TRANSPORT' && 'Транспортная компания'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.confirmationSection}>
                    <h3 className={styles.confirmationSectionTitle}>Способ оплаты</h3>
                    <div className={styles.confirmationDetails}>
                      <div className={styles.confirmationRow}>
                        <span className={styles.confirmationLabel}>Метод оплаты:</span>
                        <span>
                          {formData.paymentMethod === 'CARD' && 'Банковские карты'}
                          {formData.paymentMethod === 'CASH_COURIER' && 'Наличные курьеру'}
                          {formData.paymentMethod === 'CASH_PICKUP' && 'Наличный расчет'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {formData.notes && (
                    <div className={styles.confirmationSection}>
                      <h3 className={styles.confirmationSectionTitle}>Комментарии к заказу</h3>
                      <div className={styles.confirmationDetails}>
                        <p>{formData.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className={styles.confirmationSection}>
                    <h3 className={styles.confirmationSectionTitle}>Итоговая сумма</h3>
                    <div className={styles.orderSummary}>
                      <div className={styles.summaryRow}>
                        <span>Товаров на:</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>Доставка:</span>
                        <span>{formatPrice(deliveryCost)}</span>
                      </div>
                      {discount > 0 && (
                        <div className={styles.summaryRow}>
                          <span>Скидка:</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className={styles.summaryRow}>
                        <span>Итого:</span>
                        <span className={styles.total}>{formatPrice(total)}</span>
                      </div>
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
              {currentStep === 1 && (
                <p className={styles.hint} style={{ marginTop: '12px', fontSize: '14px', color: 'var(--color-muted)' }}>
                  Выберите способ получения заказа
                </p>
              )}
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.orderSummary}>
              <h3 className={styles.sidebarTitle}>Товары в заказе</h3>
              <div className={styles.orderItems}>
                {cartItems.map((item) => (
                  <div key={item.id} className={styles.orderItem}>
                    <div className={styles.orderItemImage}>
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
                  <div className={styles.couponInputWrapper}>
                    <div className={styles.couponInputContainer}>
                      <Input
                        label="Применить купон:"
                        value={formData.couponCode}
                        onChange={(e) => {
                          updateFormData('couponCode', e.target.value)
                          setCouponError('')
                          setAppliedCoupon(null)
                        }}
                        placeholder="Введите код купона"
                        disabled={!!appliedCoupon}
                      />
                      <div className={styles.couponMessages}>
                        {couponError && (
                          <p className={styles.couponError}>
                            {couponError}
                          </p>
                        )}
                        {appliedCoupon && (
                          <p className={styles.couponSuccess}>
                            Купон {appliedCoupon.code} применен! Скидка: {formatPrice(appliedCoupon.discount)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={!!appliedCoupon || !formData.couponCode.trim()}
                      className={styles.couponButton}
                    >
                      {appliedCoupon ? 'Применен' : 'Применить'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

