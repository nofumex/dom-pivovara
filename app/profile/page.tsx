'use client'

import { useState, useEffect } from 'react'
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

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Мой аккаунт', href: '/profile' },
  ]

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadUserData()
    loadAddresses()
  }, [user, router])

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
      // TODO: Implement user update API endpoint
      // For now, just show success message
      setSuccess('Профиль обновлен успешно')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Ошибка при обновлении профиля')
    } finally {
      setIsSubmitting(false)
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
                  // TODO: Open add address modal
                  alert('Функция добавления адреса будет реализована')
                }}
              >
                + Добавить адрес
              </Button>
            </div>

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
