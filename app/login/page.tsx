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
        
        if (data.success && (data.data?.user || data.user)) {
          const user = data.data?.user || data.user
          // Если пользователь уже авторизован, редиректим
          if (user.role === 'ADMIN') {
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
      console.log('Login: Sending request with:', formData.email)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      console.log('Login: Response status:', response.status)
      console.log('Login: Response headers:', Object.fromEntries(response.headers.entries()))

      let data
      try {
        data = await response.json()
        console.log('Login: Response data:', data)
      } catch (parseError) {
        console.error('Login: JSON parse error:', parseError)
        const text = await response.text()
        console.error('Login: Response text:', text)
        setError('Ошибка сервера. Попробуйте позже.')
        setIsSubmitting(false)
        return
      }

      if (data.success && data.data) {
        console.log('Login: Success, setting auth')
        setAuth(data.data.user, data.data.accessToken, data.data.refreshToken)
        
        // Небольшая задержка для установки cookies
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Проверяем авторизацию через /api/auth/me для синхронизации
        try {
          const meResponse = await fetch('/api/auth/me', {
            credentials: 'include',
          })
          const meData = await meResponse.json()
          console.log('Login: Me response:', meData)
          
          if (meData.success && meData.data) {
            // Обновляем состояние на основе ответа /api/auth/me
            setAuth(meData.data, data.data.accessToken, data.data.refreshToken)
          }
        } catch (meError) {
          console.error('Login: Error checking /api/auth/me:', meError)
        }
        
        // Редиректим в зависимости от роли
        // Используем window.location для полной перезагрузки страницы
        if (data.data.user.role === 'ADMIN') {
          window.location.href = '/admin'
        } else {
          window.location.href = '/'
        }
      } else {
        console.error('Login: Failed:', data.error || data.message)
        setError(data.error || data.message || 'Неверный email или пароль')
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
        <div className={styles.testAccounts}>
          <p>Тестовые аккаунты:</p>
          <ul>
            <li>
              <strong>Администратор</strong>: admin@dompivovara.ru / admin123
            </li>
            <li>
              <strong>Покупатель</strong>: user@test.ru / user123
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
