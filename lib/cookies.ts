'use client'

/**
 * Утилиты для работы с cookies на клиенте
 */

const COOKIE_CONSENT_KEY = 'cookie_consent'
const COOKIE_CONSENT_EXPIRY_DAYS = 365

export type CookieConsentStatus = 'accepted' | 'rejected' | null

/**
 * Получить значение cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  
  return null
}

/**
 * Установить cookie
 */
export function setCookie(
  name: string,
  value: string,
  days: number = COOKIE_CONSENT_EXPIRY_DAYS
): void {
  if (typeof document === 'undefined') return
  
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`
}

/**
 * Удалить cookie
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

/**
 * Проверить, дал ли пользователь согласие на использование cookies
 */
export function hasCookieConsent(): boolean {
  const consent = getCookie(COOKIE_CONSENT_KEY)
  return consent === 'accepted'
}

/**
 * Получить статус согласия на cookies
 */
export function getCookieConsentStatus(): CookieConsentStatus {
  const consent = getCookie(COOKIE_CONSENT_KEY)
  if (consent === 'accepted' || consent === 'rejected') {
    return consent
  }
  return null
}

/**
 * Сохранить согласие на использование cookies
 */
export function setCookieConsent(accepted: boolean): void {
  setCookie(COOKIE_CONSENT_KEY, accepted ? 'accepted' : 'rejected', COOKIE_CONSENT_EXPIRY_DAYS)
}

