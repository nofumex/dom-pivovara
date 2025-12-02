'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Select } from '@/components/atoms/Select/Select'
import { HeroSliderManager } from './HeroSliderManager'
import { FeaturedCategoriesManager } from './FeaturedCategoriesManager'
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
    address: initialSettings.address || '',
    workingHours: initialSettings.workingHours || '',
    
    // Заказы
    minOrderTotal: initialSettings.minOrderTotal || '1000',
    freeDeliveryThreshold: initialSettings.freeDeliveryThreshold || '5000',
    deliveryPrice: initialSettings.deliveryPrice || '500',
    
    // Сайт
    siteName: initialSettings.siteName || 'Дом Пивовара',
    siteDescription: initialSettings.siteDescription || '',
    currency: initialSettings.currency || 'RUB',
    currencySymbol: initialSettings.currencySymbol || '₽',
    
    // SEO
    seoTitle: initialSettings.seoTitle || '',
    seoDescription: initialSettings.seoDescription || '',
    seoKeywords: initialSettings.seoKeywords || '',
    
    // Попап
    popupEnabled: initialSettings.popupEnabled || false,
    popupTitle: initialSettings.popupTitle || '',
    popupText: initialSettings.popupText || '',
    popupButtonLabel: initialSettings.popupButtonLabel || '',
    popupButtonUrl: initialSettings.popupButtonUrl || '',
    popupDelaySeconds: initialSettings.popupDelaySeconds || '5',
    
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

  const defaultExtraContacts = [
    { title: 'Отдел продаж', values: ['', ''] },
    { title: 'Техническая поддержка', values: ['', ''] },
    { title: 'Оптовые заказы', values: ['', ''] },
  ]

  const [socialLinks, setSocialLinks] = useState(() => {
    const parsed = parseArray(initialSettings.socialLinks, defaultSocialLinks)
    return Array.isArray(parsed) ? parsed : defaultSocialLinks
  })

  const [extraContacts, setExtraContacts] = useState(() => {
    const parsed = parseArray(initialSettings.extraContacts, defaultExtraContacts)
    return Array.isArray(parsed) ? parsed : defaultExtraContacts
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
  const [activeTab, setActiveTab] = useState('contacts')

  useEffect(() => {
    // Обновляем socialLinks
    const parsedSocialLinks = parseArray(initialSettings.socialLinks, defaultSocialLinks)
    if (Array.isArray(parsedSocialLinks)) {
      setSocialLinks(parsedSocialLinks)
    }
    
    // Обновляем extraContacts
    const parsedExtraContacts = parseArray(initialSettings.extraContacts, defaultExtraContacts)
    if (Array.isArray(parsedExtraContacts)) {
      setExtraContacts(parsedExtraContacts)
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
        extraContacts,
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
        alert('Настройки сохранены успешно')
      } else {
        alert(data.error || 'Ошибка при сохранении настроек')
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

  const updateExtraContact = (index: number, field: 'title' | 'values', value: string | string[]) => {
    const updated = [...extraContacts]
    if (field === 'values') {
      updated[index] = { ...updated[index], values: value as string[] }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setExtraContacts(updated)
  }

  const updateExtraContactValue = (index: number, valueIndex: number, value: string) => {
    const updated = [...extraContacts]
    updated[index].values[valueIndex] = value
    setExtraContacts(updated)
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
          className={activeTab === 'site' ? styles.activeTab : ''}
          onClick={() => setActiveTab('site')}
        >
          Сайт
        </button>
        <button
          type="button"
          className={activeTab === 'seo' ? styles.activeTab : ''}
          onClick={() => setActiveTab('seo')}
        >
          SEO
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
          className={activeTab === 'popup' ? styles.activeTab : ''}
          onClick={() => setActiveTab('popup')}
        >
          Попап
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
        label="Адрес"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
      />
      <Input
              label="Режим работы"
              value={formData.workingHours}
              onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
              placeholder="Пн-Пт: 9:00-18:00, Сб-Вс: 10:00-16:00"
            />

            <h3 className={styles.subsectionTitle}>Дополнительные контакты</h3>
            {Array.isArray(extraContacts) && extraContacts.map((contact, index) => (
              <div key={index} className={styles.extraContact}>
                <Input
                  label="Название"
                  value={contact?.title || ''}
                  onChange={(e) => updateExtraContact(index, 'title', e.target.value)}
                />
                <Input
                  label="Телефон"
                  value={contact?.values?.[0] || ''}
                  onChange={(e) => updateExtraContactValue(index, 0, e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  value={contact?.values?.[1] || ''}
                  onChange={(e) => updateExtraContactValue(index, 1, e.target.value)}
                />
              </div>
            ))}

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
            <Input
              label="Порог бесплатной доставки (₽)"
              type="number"
              value={formData.freeDeliveryThreshold}
              onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: e.target.value })}
            />
            <Input
              label="Стоимость доставки (₽)"
              type="number"
              value={formData.deliveryPrice}
              onChange={(e) => setFormData({ ...formData, deliveryPrice: e.target.value })}
            />
          </div>
        )}

        {activeTab === 'site' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Настройки сайта</h2>
            <Input
              label="Название сайта"
              value={formData.siteName}
              onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
            />
            <Input
              label="Описание сайта"
              value={formData.siteDescription}
              onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
            />
            <Input
              label="Валюта"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            />
            <Input
              label="Символ валюты"
              value={formData.currencySymbol}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
            />
          </div>
        )}

        {activeTab === 'seo' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>SEO настройки</h2>
            <Input
              label="SEO заголовок"
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
            />
            <Input
              label="SEO описание"
              value={formData.seoDescription}
              onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
            />
            <Input
              label="SEO ключевые слова"
              value={formData.seoKeywords}
              onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
            />
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
          </div>
        )}

        {activeTab === 'popup' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Настройки попапа</h2>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="popupEnabled"
                checked={formData.popupEnabled}
                onChange={(e) => setFormData({ ...formData, popupEnabled: e.target.checked })}
              />
              <label htmlFor="popupEnabled">Включить попап</label>
            </div>
            <Input
              label="Заголовок попапа"
              value={formData.popupTitle}
              onChange={(e) => setFormData({ ...formData, popupTitle: e.target.value })}
            />
            <Input
              label="Текст попапа"
              value={formData.popupText}
              onChange={(e) => setFormData({ ...formData, popupText: e.target.value })}
            />
            <Input
              label="Текст кнопки"
              value={formData.popupButtonLabel}
              onChange={(e) => setFormData({ ...formData, popupButtonLabel: e.target.value })}
            />
            <Input
              label="URL кнопки"
              value={formData.popupButtonUrl}
              onChange={(e) => setFormData({ ...formData, popupButtonUrl: e.target.value })}
            />
            <Input
              label="Задержка показа (секунды)"
              type="number"
              value={formData.popupDelaySeconds}
              onChange={(e) => setFormData({ ...formData, popupDelaySeconds: e.target.value })}
            />
          </div>
        )}

        {activeTab === 'slider' && (
          <HeroSliderManager />
        )}

        {activeTab === 'featuredCategories' && (
          <FeaturedCategoriesManager />
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
