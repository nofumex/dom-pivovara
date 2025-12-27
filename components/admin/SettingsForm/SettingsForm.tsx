'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { HeroSliderManager } from './HeroSliderManager'
import { FeaturedCategoriesManager } from './FeaturedCategoriesManager'
import { StoresManager } from './StoresManager'
import styles from './SettingsForm.module.scss'

interface SettingsFormProps {
  settings: Record<string, any>
}

export function SettingsForm({ settings: initialSettings }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    // Контакты
    contactEmail: initialSettings.contactEmail || '',
    contactPhone: initialSettings.contactPhone || '',
    contactPhone2: initialSettings.contactPhone2 || '',
    workingHours: initialSettings.workingHours || '',
    
    // Заказы
    minOrderTotal: initialSettings.minOrderTotal || '1000',
    
    // Слайдер
    heroSliderInterval: initialSettings.heroSliderInterval || '5000',
  })

  // Функция для безопасного преобразования в массив
  const parseArray = (value: any, defaultValue: any[]) => {
    if (!value) return defaultValue
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : defaultValue
      } catch {
        return defaultValue
      }
    }
    return defaultValue
  }

  const defaultSocialLinks = [
    { label: 'VK', url: '' },
    { label: 'YouTube', url: '' },
    { label: 'Telegram', url: '' },
    { label: 'Instagram', url: '' },
  ]

  const [socialLinks, setSocialLinks] = useState(() => {
    const parsed = parseArray(initialSettings.socialLinks, defaultSocialLinks)
    return Array.isArray(parsed) ? parsed : defaultSocialLinks
  })

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: initialSettings.emailSettings?.smtpHost || '',
    smtpPort: initialSettings.emailSettings?.smtpPort || '587',
    smtpUser: initialSettings.emailSettings?.smtpUser || '',
    smtpPassword: initialSettings.emailSettings?.smtpPassword || '',
    fromEmail: initialSettings.emailSettings?.fromEmail || '',
    fromName: initialSettings.emailSettings?.fromName || '',
    companyEmail: initialSettings.emailSettings?.companyEmail || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTestingSMTP, setIsTestingSMTP] = useState(false)
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)
  const [activeTab, setActiveTab] = useState('contacts')

  useEffect(() => {
    // Обновляем socialLinks
    const parsedSocialLinks = parseArray(initialSettings.socialLinks, defaultSocialLinks)
    if (Array.isArray(parsedSocialLinks)) {
      setSocialLinks(parsedSocialLinks)
    }
    
    // Обновляем emailSettings
    if (initialSettings.emailSettings) {
      // Проверяем, является ли emailSettings объектом или строкой JSON
      let emailSettingsData = initialSettings.emailSettings
      if (typeof emailSettingsData === 'string') {
        try {
          emailSettingsData = JSON.parse(emailSettingsData)
        } catch {
          emailSettingsData = {}
        }
      }
      if (typeof emailSettingsData === 'object' && emailSettingsData !== null) {
        setEmailSettings({
          smtpHost: emailSettingsData.smtpHost || '',
          smtpPort: emailSettingsData.smtpPort || '587',
          smtpUser: emailSettingsData.smtpUser || '',
          smtpPassword: emailSettingsData.smtpPassword || '',
          fromEmail: emailSettingsData.fromEmail || '',
          fromName: emailSettingsData.fromName || '',
          companyEmail: emailSettingsData.companyEmail || '',
        })
      }
    }
  }, [initialSettings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        ...formData,
        socialLinks,
        emailSettings,
        heroSliderInterval: formData.heroSliderInterval,
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (data.success) {
        // Показываем сообщение об успехе
        const successMessage = document.createElement('div')
        successMessage.textContent = 'Настройки успешно сохранены'
        successMessage.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #27ae60; color: white; padding: 16px 24px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
        document.body.appendChild(successMessage)
        setTimeout(() => {
          successMessage.remove()
        }, 3000)
      } else {
        // Показываем сообщение об ошибке
        const errorMessage = document.createElement('div')
        errorMessage.textContent = data.error || 'Ошибка при сохранении настроек'
        errorMessage.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #e74c3c; color: white; padding: 16px 24px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
        document.body.appendChild(errorMessage)
        setTimeout(() => {
          errorMessage.remove()
        }, 5000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Ошибка при сохранении настроек')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateSocialLink = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...socialLinks]
    updated[index] = { ...updated[index], [field]: value }
    setSocialLinks(updated)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={activeTab === 'contacts' ? styles.activeTab : ''}
          onClick={() => setActiveTab('contacts')}
        >
          Контакты
        </button>
        <button
          type="button"
          className={activeTab === 'orders' ? styles.activeTab : ''}
          onClick={() => setActiveTab('orders')}
        >
          Заказы
        </button>
        <button
          type="button"
          className={activeTab === 'email' ? styles.activeTab : ''}
          onClick={() => setActiveTab('email')}
        >
          Email
        </button>
        <button
          type="button"
          className={activeTab === 'slider' ? styles.activeTab : ''}
          onClick={() => setActiveTab('slider')}
        >
          Слайдер
        </button>
        <button
          type="button"
          className={activeTab === 'featuredCategories' ? styles.activeTab : ''}
          onClick={() => setActiveTab('featuredCategories')}
        >
          Карточки категорий
        </button>
        <button
          type="button"
          className={activeTab === 'stores' ? styles.activeTab : ''}
          onClick={() => setActiveTab('stores')}
        >
          Магазины
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'contacts' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Контактная информация</h2>
      <Input
        label="Email для связи"
        type="email"
        value={formData.contactEmail}
        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
      />
      <Input
        label="Телефон"
        type="tel"
        value={formData.contactPhone}
        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
      />
            <Input
              label="Дополнительный телефон"
              type="tel"
              value={formData.contactPhone2}
              onChange={(e) => setFormData({ ...formData, contactPhone2: e.target.value })}
      />
      <Input
              label="Режим работы"
              value={formData.workingHours}
              onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
              placeholder="Пн-Пт: 9:00-18:00, Сб-Вс: 10:00-16:00"
            />

            <h3 className={styles.subsectionTitle}>Социальные сети</h3>
            {Array.isArray(socialLinks) && socialLinks.map((link, index) => (
              <div key={index} className={styles.socialLink}>
                <Input
                  label="Название"
                  value={link?.label || ''}
                  onChange={(e) => updateSocialLink(index, 'label', e.target.value)}
                />
                <Input
                  label="URL"
                  type="url"
                  value={link?.url || ''}
                  onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Настройки заказов</h2>
            <Input
              label="Минимальная сумма заказа (₽)"
              type="number"
              value={formData.minOrderTotal}
              onChange={(e) => setFormData({ ...formData, minOrderTotal: e.target.value })}
            />
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              Минимальная сумма заказа для оформления. Заказы с суммой меньше указанной не будут приниматься.
            </p>
          </div>
        )}

        {activeTab === 'email' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Настройки email</h2>
            <Input
              label="SMTP хост"
              value={emailSettings.smtpHost}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
            />
            <Input
              label="SMTP порт"
              type="number"
              value={emailSettings.smtpPort}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
            />
            <Input
              label="SMTP пользователь"
              value={emailSettings.smtpUser}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
            />
            <Input
              label="SMTP пароль"
              type="password"
              value={emailSettings.smtpPassword}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
            />
            <Input
              label="Email отправителя"
              type="email"
              value={emailSettings.fromEmail}
              onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
            />
            <Input
              label="Имя отправителя"
              value={emailSettings.fromName}
              onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
            />
            <Input
              label="Email компании"
              type="email"
              value={emailSettings.companyEmail}
              onChange={(e) => setEmailSettings({ ...emailSettings, companyEmail: e.target.value })}
            />
            
            <div style={{ marginTop: '20px', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>Тестирование SMTP подключения</h3>
              <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-muted)' }}>
                Проверьте подключение к SMTP серверу перед сохранением настроек
              </p>
              <Button
                variant="outline"
                onClick={async () => {
                  setIsTestingSMTP(true)
                  setSmtpTestResult(null)
                  
                  try {
                    const response = await fetch('/api/admin/test-smtp', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        smtpHost: emailSettings.smtpHost,
                        smtpPort: emailSettings.smtpPort,
                        smtpUser: emailSettings.smtpUser,
                        smtpPassword: emailSettings.smtpPassword,
                      }),
                    })
                    
                    const data = await response.json()
                    
                    if (data.success) {
                      setSmtpTestResult({
                        success: true,
                        message: data.message || 'SMTP подключение успешно установлено',
                        details: data.data?.details,
                      })
                    } else {
                      setSmtpTestResult({
                        success: false,
                        message: data.error || 'Ошибка подключения',
                        details: data.details || data.data?.details,
                      })
                    }
                  } catch (error: any) {
                    setSmtpTestResult({
                      success: false,
                      message: 'Ошибка при тестировании подключения: ' + (error.message || 'Неизвестная ошибка'),
                    })
                  } finally {
                    setIsTestingSMTP(false)
                  }
                }}
                disabled={isTestingSMTP || !emailSettings.smtpHost || !emailSettings.smtpPort || !emailSettings.smtpUser || !emailSettings.smtpPassword}
              >
                {isTestingSMTP ? 'Тестирование...' : 'Тестировать SMTP подключение'}
              </Button>
              
                  {smtpTestResult && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: smtpTestResult.success ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                    border: `1px solid ${smtpTestResult.success ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)'}`,
                    color: smtpTestResult.success ? '#27ae60' : '#e74c3c',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                    {smtpTestResult.success ? '✅ ' : '❌ '}
                    {smtpTestResult.message}
                  </div>
                  {smtpTestResult.details && (
                    <div style={{ marginTop: '8px', fontSize: '13px', opacity: 0.9 }}>
                      {smtpTestResult.details.suggestion && (
                        <div style={{ marginTop: '6px', padding: '8px', backgroundColor: 'rgba(0, 0, 0, 0.05)', borderRadius: '4px', whiteSpace: 'pre-line' }}>
                          <strong>💡 Рекомендация:</strong> {smtpTestResult.details.suggestion}
                        </div>
                      )}
                      {smtpTestResult.details.blockedPorts && (
                        <div style={{ marginTop: '6px', padding: '8px', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: '4px', color: '#e74c3c' }}>
                          <strong>⚠️ Заблокированные порты:</strong> {smtpTestResult.details.blockedPorts}
                        </div>
                      )}
                      {smtpTestResult.details.workingPort && smtpTestResult.details.originalPort && (
                        <div style={{ marginTop: '6px', padding: '8px', backgroundColor: 'rgba(46, 204, 113, 0.1)', borderRadius: '4px', color: '#27ae60' }}>
                          <strong>✅ Решение найдено:</strong> Порт {smtpTestResult.details.workingPort} работает! 
                          Измените порт в настройках SMTP на {smtpTestResult.details.workingPort}.
                        </div>
                      )}
                      {smtpTestResult.details.code && (
                        <div style={{ marginTop: '4px', fontSize: '12px' }}>
                          <strong>Код ошибки:</strong> {smtpTestResult.details.code}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'slider' && (
          <HeroSliderManager />
        )}

        {activeTab === 'featuredCategories' && (
          <FeaturedCategoriesManager />
        )}

        {activeTab === 'stores' && (
          <StoresManager />
        )}
      </div>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : 'Сохранить все настройки'}
        </Button>
      </div>
    </form>
  )
}
