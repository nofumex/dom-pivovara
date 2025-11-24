'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import styles from './page.module.scss'

export default function AdminLoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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

      const data = await response.json()
      if (data.success) {
        setAuth(data.data.user, data.data.accessToken, data.data.refreshToken)
        
        // Set cookies
        document.cookie = `accessToken=${data.data.accessToken}; path=/; max-age=900`
        document.cookie = `refreshToken=${data.data.refreshToken}; path=/; max-age=604800`
        
        router.push('/admin')
      } else {
        setError(data.error || 'Ошибка при входе')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Ошибка при входе в систему')
    } finally {
      setIsSubmitting(false)
    }
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

