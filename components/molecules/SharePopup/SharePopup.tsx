'use client'

import { useEffect, useRef } from 'react'
import styles from './SharePopup.module.scss'

interface SharePopupProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title: string
}

export function SharePopup({ isOpen, onClose, url, title }: SharePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const shareText = encodeURIComponent(title)
  const shareUrl = encodeURIComponent(url)

  const handleShare = (platform: 'vk' | 'telegram' | 'whatsapp') => {
    let shareLink = ''
    
    switch (platform) {
      case 'vk':
        shareLink = `https://vk.com/share.php?url=${shareUrl}&title=${shareText}`
        break
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`
        break
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${shareText}%20${shareUrl}`
        break
    }
    
    window.open(shareLink, '_blank', 'width=600,height=400')
    onClose()
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={popupRef} className={styles.popup}>
        <div className={styles.header}>
          <span className={styles.title}>Поделиться</span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <div className={styles.content}>
          <button
            className={styles.socialButton}
            onClick={() => handleShare('vk')}
          >
            VK
          </button>
          <button
            className={styles.socialButton}
            onClick={() => handleShare('telegram')}
          >
            TG
          </button>
          <button
            className={styles.socialButton}
            onClick={() => handleShare('whatsapp')}
          >
            WA
          </button>
        </div>
      </div>
    </>
  )
}

