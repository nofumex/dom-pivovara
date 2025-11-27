'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import styles from './page.module.scss'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(true)

  // Проверяем, авторизован ли пользователь через cookies
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        })
        const data = await response.json()
        
        if (data.success && data.user) {
          // Если пользователь уже авторизован, редиректим
          if (data.user.role === 'ADMIN') {
            router.replace('/admin')
          } else {
            router.replace('/')
          }
        } else {
          setIsChecking(false)
        }
      } catch (error) {
        setIsChecking(false)
      }
    }
    
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        setError('Ошибка сервера. Попробуйте позже.')
        setIsSubmitting(false)
        return
      }

      if (data.success) {
        setAuth(data.user, data.accessToken, data.refreshToken)
        
        // Редиректим в зависимости от роли
        if (data.user.role === 'ADMIN') {
          router.replace('/admin')
        } else {
          router.replace('/')
        }
      } else {
        setError(data.error || 'Неверный email или пароль')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Ошибка при входе. Попробуйте позже.')
      setIsSubmitting(false)
    }
  }

  if (isChecking) {
    return (
      <div className={styles.login}>
        <div className={styles.card}>
          <p>Проверка авторизации...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.login}>
      <div className={styles.card}>
        <h1 className={styles.title}>Вход</h1>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            autoComplete="email"
          />
          <Input
            label="Пароль"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            autoComplete="current-password"
          />
          <Button type="submit" variant="primary" disabled={isSubmitting} className={styles.submitButton}>
            {isSubmitting ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </div>
    </div>
  )
}
