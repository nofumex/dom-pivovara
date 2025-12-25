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
            className={`${styles.socialButton} ${styles.vk}`}
            onClick={() => handleShare('vk')}
            aria-label="ВКонтакте"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4.5 6.5c.12 6.06 3.15 9.63 8.45 9.63h.3v-3.1c1.97.2 3.47 1.65 4.08 3.1h2.77c-.75-2.15-2.22-3.55-3.38-4.1 1.16-.67 2.8-2.29 3.19-5h-2.53c-.56 1.99-2.2 3.61-3.75 3.78V6.5h-2.5v6.84c-1.56-.4-3.48-2.16-3.56-6.84H4.5Z"
                fill="white"
              />
            </svg>
          </button>
          <button
            className={`${styles.socialButton} ${styles.telegram}`}
            onClick={() => handleShare('telegram')}
            aria-label="Telegram"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.174 1.857-.928 6.678-1.309 8.855-.177.998-.525 1.332-.86 1.365-.73.064-1.283-.482-1.99-.945-1.103-.73-1.727-1.184-2.797-1.897-1.21-.9-.425-1.395.263-2.203.18-.21 3.256-2.988 3.317-3.243.007-.032.014-.15-.056-.212-.07-.062-.173-.041-.248-.024-.106.024-1.793 1.14-5.062 3.345-.479.336-.913.5-1.304.491-.43-.01-1.256-.242-1.87-.442-.755-.248-1.354-.38-1.303-.803.027-.22.325-.445.895-.675 3.498-1.524 5.83-2.529 7.002-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.024.465.14.118.095.151.223.167.312.016.09.036.297.02.458z" fill="white"/>
            </svg>
          </button>
          <button
            className={`${styles.socialButton} ${styles.whatsapp}`}
            onClick={() => handleShare('whatsapp')}
            aria-label="WhatsApp"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}















