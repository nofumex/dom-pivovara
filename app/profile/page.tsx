'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { useAuthStore } from '@/store/auth-store'
import styles from './page.module.scss'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: string
}

interface Address {
  id: string
  name: string
  street: string
  city: string
  region: string
  zipCode: string
  phone: string | null
  isMain: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const setAuth = useAuthStore((state) => state.setAuth)
  const hydrated = useAuthStore((state) => state.hydrated)
  const authChecked = useAuthStore((state) => state.authChecked)
  const [userData, setUserData] = useState<User | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [addressError, setAddressError] = useState('')
  const [addressSuccess, setAddressSuccess] = useState('')
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [addressSubmitting, setAddressSubmitting] = useState(false)
  const [addressForm, setAddressForm] = useState({
    name: '',
    street: '',
    city: '',
    region: '',
    zipCode: '',
    phone: '',
    isMain: false,
  })

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Мой аккаунт', href: '/profile' },
  ]

  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!hydrated || !authChecked) {
      return
    }

    if (!user) {
      setIsLoading(false)
      router.replace('/login')
      return
    }

    if (hasLoadedRef.current) {
      return
    }

    hasLoadedRef.current = true
    loadUserData()
    loadAddresses()
  }, [user, router, hydrated, authChecked])

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      const data = await response.json()
      
      if (data.success && data.data) {
        setUserData(data.data)
        setFormData({
          firstName: data.data.firstName || '',
          lastName: data.data.lastName || '',
          phone: data.data.phone || '',
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAddresses = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/users/${user.id}/addresses`, {
        credentials: 'include',
      })
      const data = await response.json()
      
      if (data.success && data.data) {
        setAddresses(data.data)
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      if (!user?.id) {
        setError('Пользователь не найден')
        return
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        setUserData(data.data)
        setSuccess('Профиль обновлен успешно')
        setIsEditing(false)

        const currentTokens = useAuthStore.getState()
        setAuth(
          data.data,
          currentTokens.accessToken || accessToken || '',
          currentTokens.refreshToken || refreshToken || ''
        )
      } else {
        setError(data.error || data.message || 'Не удалось обновить профиль')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Ошибка при обновлении профиля')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetAddressForm = () => {
    setEditingAddressId(null)
    setAddressForm({
      name: '',
      street: '',
      city: '',
      region: '',
      zipCode: '',
      phone: '',
      isMain: false,
    })
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setAddressError('')
    setAddressSuccess('')
    setAddressSubmitting(true)

    try {
      const isEdit = Boolean(editingAddressId)
      const endpoint = isEdit
        ? `/api/users/${user.id}/addresses/${editingAddressId}`
        : `/api/users/${user.id}/addresses`

      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addressForm),
      })

      const data = await response.json()

      if (data.success) {
        setAddressSuccess(isEdit ? 'Адрес обновлен' : 'Адрес добавлен')
        resetAddressForm()
        setIsAddressFormOpen(false)
        await loadAddresses()
      } else {
        setAddressError(data.error || data.message || 'Не удалось сохранить адрес')
      }
    } catch (err) {
      console.error('Error saving address:', err)
      setAddressError('Ошибка при сохранении адреса')
    } finally {
      setAddressSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main>
        <div className="container">
          <p>Загрузка...</p>
        </div>
      </main>
    )
  }

  if (!userData) {
    return (
      <main>
        <div className="container">
          <p>Ошибка загрузки данных</p>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.avatar}>
              {userData.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className={styles.headerInfo}>
              <h1 className={styles.title}>
                {userData.firstName} {userData.lastName}
              </h1>
              <p className={styles.subtitle}>{userData.email}</p>
            </div>
          </div>
        </div>

        <div className={styles.layout}>
          <div className={styles.profileSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Личная информация</h2>
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Редактировать
                </Button>
              )}
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            {isEditing ? (
              <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                  label="Имя"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Фамилия"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
                <Input
                  label="Email"
                  value={userData.email}
                  disabled
                  type="email"
                />
                <Input
                  label="Телефон"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  type="tel"
                />
                <div className={styles.formActions}>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        phone: userData.phone || '',
                      })
                      setError('')
                      setSuccess('')
                    }}
                    disabled={isSubmitting}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            ) : (
              <div className={styles.infoBlock}>
                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>👤</div>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Имя</span>
                    <span className={styles.infoValue}>{userData.firstName}</span>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>👤</div>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Фамилия</span>
                    <span className={styles.infoValue}>{userData.lastName}</span>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>✉️</div>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{userData.email}</span>
                  </div>
                </div>
                {userData.phone && (
                  <div className={styles.infoRow}>
                    <div className={styles.infoIcon}>📞</div>
                    <div className={styles.infoContent}>
                      <span className={styles.infoLabel}>Телефон</span>
                      <span className={styles.infoValue}>{userData.phone}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.addressesSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Адреса доставки</h2>
              <Button
                variant="outline"
                onClick={() => {
                  resetAddressForm()
                  setIsAddressFormOpen(true)
                  setAddressError('')
                  setAddressSuccess('')
                }}
              >
                + Добавить адрес
              </Button>
            </div>

            {addressError && <div className={styles.error}>{addressError}</div>}
            {addressSuccess && <div className={styles.success}>{addressSuccess}</div>}

            {isAddressFormOpen && (
              <form onSubmit={handleAddressSubmit} className={styles.addressForm}>
                <div className={styles.formGrid}>
                  <Input
                    label="Название"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Город"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    required
                  />
                  <Input
                    label="Улица"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    required
                  />
                  <Input
                    label="Регион"
                    value={addressForm.region}
                    onChange={(e) => setAddressForm({ ...addressForm, region: e.target.value })}
                    required
                  />
                  <Input
                    label="Индекс"
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                    required
                  />
                  <Input
                    label="Телефон"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    type="tel"
                  />
                </div>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={addressForm.isMain}
                    onChange={(e) => setAddressForm({ ...addressForm, isMain: e.target.checked })}
                  />
                  <span>Сделать основным адресом</span>
                </label>
                <div className={styles.formActions}>
                  <Button type="submit" variant="primary" disabled={addressSubmitting}>
                    {addressSubmitting ? 'Сохранение...' : editingAddressId ? 'Сохранить изменения' : 'Добавить адрес'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddressFormOpen(false)
                      resetAddressForm()
                    }}
                    disabled={addressSubmitting}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            )}

            {addresses.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📍</div>
                <p>У вас пока нет сохраненных адресов</p>
                <p className={styles.emptySubtext}>Добавьте адрес для быстрой доставки</p>
              </div>
            ) : (
              <div className={styles.addressesList}>
                {addresses.map((address) => (
                  <div key={address.id} className={styles.addressCard}>
                    {address.isMain && (
                      <span className={styles.mainBadge}>Основной</span>
                    )}
                    <div className={styles.addressIcon}>🏠</div>
                    <h3 className={styles.addressName}>{address.name}</h3>
                    <p className={styles.addressText}>
                      {address.street}, {address.city}, {address.region}, {address.zipCode}
                    </p>
                    {address.phone && (
                      <p className={styles.addressPhone}>📞 {address.phone}</p>
                    )}
                    <div className={styles.addressActions}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAddressId(address.id)
                          setAddressForm({
                            name: address.name,
                            street: address.street,
                            city: address.city,
                            region: address.region,
                            zipCode: address.zipCode,
                            phone: address.phone || '',
                            isMain: address.isMain,
                          })
                          setIsAddressFormOpen(true)
                          setAddressError('')
                          setAddressSuccess('')
                        }}
                      >
                        Редактировать
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
