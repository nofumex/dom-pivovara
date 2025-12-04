'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/molecules/Modal/Modal'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { useAuthStore } from '@/store/auth-store'
import styles from './ProfileModal.module.scss'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const isAuthenticated = user !== null && accessToken !== null
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    code: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Reset error when modal opens/closes and check auth
  useEffect(() => {
    if (isOpen) {
      setError('')
      // Проверяем авторизацию при открытии модального окна
      const checkAuth = async () => {
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
          })
          const data = await response.json()
          if (data.success && data.data) {
            const { setAuth } = useAuthStore.getState()
            // Обновляем состояние, если пользователь авторизован
            const currentState = useAuthStore.getState()
            if (!currentState.user || currentState.user.id !== data.data.id) {
              // Обновляем только если состояние изменилось
              setAuth(data.data, currentState.accessToken || '', currentState.refreshToken || '')
            }
          }
        } catch (error) {
          console.error('Error checking auth:', error)
        }
      }
      checkAuth()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (isLogin) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        })

        let data
        try {
          data = await response.json()
        } catch (parseError) {
          // If response is not JSON, it's likely a server error
          setError('Ошибка сервера. Попробуйте позже.')
          return
        }
        
        if (data.success && data.data) {
          const { setAuth } = useAuthStore.getState()
          const userData = data.data.user || data.data
          const accessToken = data.data.accessToken || data.accessToken
          const refreshToken = data.data.refreshToken || data.refreshToken
          
          setAuth(userData, accessToken, refreshToken)
          
          // Небольшая задержка для установки cookies
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Проверяем авторизацию через /api/auth/me для синхронизации
          try {
            const meResponse = await fetch('/api/auth/me', {
              credentials: 'include',
            })
            const meData = await meResponse.json()
            if (meData.success && meData.data) {
              setAuth(meData.data, accessToken, refreshToken)
            }
          } catch (meError) {
            console.error('Error checking /api/auth/me:', meError)
          }
          
          // Reset form
          setFormData({ email: '', phone: '', password: '', code: '' })
          setError('')
          onClose()
          
          // Обновляем страницу для синхронизации состояния
          window.location.reload()
        } else {
          // Show specific error message from server
          let errorMessage = data.error || 'Ошибка при входе. Проверьте правильность введенных данных.'
          
          // Check for database connection errors
          if (data.error?.includes('database') || data.error?.includes('5432') || data.error?.includes('Can\'t reach database')) {
            errorMessage = 'Ошибка подключения к базе данных. Убедитесь, что база данных запущена и доступна.'
          }
          
          setError(errorMessage)
        }
      } else {
        // Registration logic
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      
      // Handle network errors or database connection errors
      let errorMessage = 'Ошибка подключения к серверу. Проверьте подключение к интернету или попробуйте позже.'
      
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      clearAuth()
      // Clear cookies
      document.cookie = 'accessToken=; path=/; max-age=0'
      document.cookie = 'refreshToken=; path=/; max-age=0'
      onClose()
    } catch (error) {
      console.error('Logout error:', error)
      clearAuth()
      document.cookie = 'accessToken=; path=/; max-age=0'
      document.cookie = 'refreshToken=; path=/; max-age=0'
      onClose()
    }
  }

  // If user is authenticated, show account options
  if (isAuthenticated && user) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Мой аккаунт">
        <div className={styles.userInfo}>
          <div className={styles.userDetails}>
            <p className={styles.userName}>
              {user.firstName} {user.lastName}
            </p>
            <p className={styles.userEmail}>{user.email}</p>
            {user.phone && <p className={styles.userPhone}>{user.phone}</p>}
          </div>
          
          <div className={styles.actions}>
            {user.role === 'ADMIN' ? (
              <Button
                variant="primary"
                onClick={() => {
                  onClose()
                  router.push('/admin')
                }}
                className={styles.actionButton}
              >
                Админ панель
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  onClose()
                  router.push('/profile')
                }}
                className={styles.actionButton}
              >
                Мой аккаунт
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleLogout}
              className={styles.actionButton}
            >
              Выйти
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  // Show login form if not authenticated
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isLogin ? 'Вход' : 'Регистрация'}>
      {isLogin && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          background: '#FFF5EB', 
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <strong>Тестовые аккаунты:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Пользователь: <code>user@test.ru</code> / <code>user123</code></li>
            <li>Админ: <code>admin@dompivovara.ru</code> / <code>admin123</code></li>
          </ul>
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        <Input
          type="email"
          label="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder="your@email.com"
        />

        <Input
          type="password"
          label="Пароль"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          placeholder="••••••••"
        />

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Вход...' : 'Войти'}
          </Button>
          <button
            type="button"
            className={styles.switchButton}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </form>
    </Modal>
  )
}








