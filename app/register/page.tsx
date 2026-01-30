'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReCAPTCHA from 'react-google-recaptcha'
import Link from 'next/link'
import { Input } from '@/components/atoms/Input/Input'
import { Button } from '@/components/atoms/Button/Button'
import { useAuthStore } from '@/store/auth-store'
import styles from './page.module.scss'

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!recaptchaToken) {
      setError('Пожалуйста, подтвердите, что вы не робот')
      return
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Введите имя и фамилию')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          recaptchaToken,
        }),
      })

      let data
      try {
        data = await response.json()
      } catch {
        setError('Ошибка сервера. Попробуйте позже.')
        return
      }

      if (data.success && data.data) {
        const userData = data.data.user || data.data
        const accessToken = data.data.accessToken || data.accessToken
        const refreshToken = data.data.refreshToken || data.refreshToken

        setAuth(userData, accessToken, refreshToken)

        await new Promise((resolve) => setTimeout(resolve, 200))

        try {
          const meResponse = await fetch('/api/auth/me', {
            credentials: 'include',
          })
          const meData = await meResponse.json()
          if (meData.success && meData.data) {
            setAuth(meData.data, accessToken, refreshToken)
          }
        } catch {
          // игнорируем, если дополнительная проверка не удалась
        }

        router.replace('/')
      } else {
        const errorMessage = data.error || data.message || 'Ошибка при регистрации. Проверьте введенные данные.'
        setError(errorMessage)
      }
    } catch (err: any) {
      let errorMessage = 'Ошибка подключения к серверу. Попробуйте позже.'
      if (err?.message?.includes('database') || err?.message?.includes('5432')) {
        errorMessage = 'Ошибка подключения к базе данных. Убедитесь, что база данных запущена и доступна.'
      }
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.login}>
      <div className={styles.card}>
        <h1 className={styles.title}>Регистрация</h1>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Имя"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            autoComplete="given-name"
          />
          <Input
            label="Фамилия"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            autoComplete="family-name"
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            autoComplete="email"
          />
          <Input
            label="Телефон"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+7 (999) 000-00-00"
            autoComplete="tel"
          />
          <Input
            label="Пароль"
            type="password"
            name="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            autoComplete="new-password"
          />
          {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
            <div className={styles.recaptchaContainer}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={(token) => setRecaptchaToken(token)}
              />
            </div>
          ) : (
            <div className={styles.error}>
              Ошибка: reCAPTCHA не настроена. Проверьте переменную NEXT_PUBLIC_RECAPTCHA_SITE_KEY в .env файле.
            </div>
          )}
          <div className={styles.privacyNote}>
            <p>
              Нажимая кнопку «Зарегистрироваться», вы соглашаетесь с{' '}
              <Link href="/privaci" target="_blank" rel="noopener noreferrer" className={styles.privacyLink}>
                условиями конфиденциальности
              </Link>
            </p>
          </div>
          <Button type="submit" variant="primary" disabled={isSubmitting} className={styles.submitButton}>
            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
          <div className={styles.switchAuth}>
            <span>Уже есть аккаунт? </span>
            <Link href="/login" className={styles.switchAuthLink}>
              Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

