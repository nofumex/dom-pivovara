'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import styles from './page.module.scss'

export default function AdminLoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const isAuthenticated = user !== null && accessToken !== null
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    }
  }, [isAuthenticated, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        // If response is not JSON, it's likely a server error
        setError('Ошибка сервера. Попробуйте позже.')
        return
      }
      
      if (data.success) {
        setAuth(data.data.user, data.data.accessToken, data.data.refreshToken)
        
        // Set cookies
        document.cookie = `accessToken=${data.data.accessToken}; path=/; max-age=900`
        document.cookie = `refreshToken=${data.data.refreshToken}; path=/; max-age=604800`
        
        router.push('/admin')
      } else {
        // Show specific error message from server
        let errorMessage = data.error || 'Ошибка при входе. Проверьте правильность введенных данных.'
        
        // Check for database connection errors
        if (data.error?.includes('database') || data.error?.includes('5432') || data.error?.includes('Can\'t reach database')) {
          errorMessage = 'Ошибка подключения к базе данных. Убедитесь, что база данных запущена и доступна.'
        }
        
        setError(errorMessage)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle network errors or database connection errors
      let errorMessage = 'Ошибка при входе в систему. Попробуйте позже.'
      
      if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Ошибка подключения к серверу. Проверьте подключение к интернету или попробуйте позже.'
      } else if (error.message?.includes('database') || error.message?.includes('5432')) {
        errorMessage = 'Ошибка подключения к базе данных. Убедитесь, что база данных запущена и доступна.'
      }
      
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show account options if already authenticated
  if (isAuthenticated && user) {
    return (
      <div className={styles.login}>
        <div className={styles.card}>
          <h1 className={styles.title}>Вы уже авторизованы</h1>
          <div className={styles.userInfo}>
            <p className={styles.userName}>
              {user.firstName} {user.lastName}
            </p>
            <p className={styles.userEmail}>{user.email}</p>
          </div>
          
          <div className={styles.actions}>
            {user.role === 'ADMIN' ? (
              <Button
                variant="primary"
                onClick={() => router.push('/admin')}
                className={styles.actionButton}
              >
                Перейти в админ панель
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => router.push('/')}
                className={styles.actionButton}
              >
                Вернуться на главную
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.login}>
      <div className={styles.card}>
        <h1 className={styles.title}>Вход в админ-панель</h1>
        <div style={{ 
          marginBottom: '20px', 
          padding: '12px', 
          background: '#FFF5EB', 
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <strong>Тестовые аккаунты:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Админ: <code>admin@test.ru</code> / <code>admin123</code></li>
            <li>Админ (основной): <code>admin@dompivovara.ru</code> / <code>admin123</code></li>
          </ul>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          <Input
            type="email"
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="admin@example.com"
          />
          <Input
            type="password"
            label="Пароль"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="••••••••"
          />
          <Button type="submit" variant="primary" disabled={isSubmitting} className={styles.submitButton}>
            {isSubmitting ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </div>
    </div>
  )
}

