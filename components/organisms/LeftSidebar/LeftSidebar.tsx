'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { CatalogSidebar } from '../CatalogSidebar/CatalogSidebar'
import { SidebarSections } from '../SidebarSections/SidebarSections'
import styles from './LeftSidebar.module.scss'

export function LeftSidebar() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const isCatalogPage = pathname === '/catalog' || pathname?.startsWith('/catalog/')
  const [isSidebarVisible, setIsSidebarVisible] = useState(isHomePage || isCatalogPage)
  const [isDropdownMode, setIsDropdownMode] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // На главной и в каталоге всегда показываем сайдбар
    if (isHomePage || isCatalogPage) {
      setIsSidebarVisible(true)
      setIsDropdownMode(false)
      return
    }

    // На остальных страницах отслеживаем наведение на кнопку Каталог
    const catalogButton = document.querySelector('[data-catalog-button]')
    const sidebarContainer = document.querySelector('[class*="sidebarContainer"]')
    const subcategoriesPanel = document.querySelector('[class*="subcategoriesPanel"]')
    
    if (!catalogButton) return

    let timeoutId: NodeJS.Timeout

    const handleMouseEnter = () => {
      clearTimeout(timeoutId)
      setIsSidebarVisible(true)
      setIsDropdownMode(true)
    }
    
    const handleMouseLeave = () => {
      timeoutId = setTimeout(() => {
        setIsSidebarVisible(false)
        setIsDropdownMode(false)
      }, 200)
    }

    const handleSidebarEnter = () => {
      clearTimeout(timeoutId)
      setIsSidebarVisible(true)
      setIsDropdownMode(true)
    }

    const handleSidebarLeave = () => {
      timeoutId = setTimeout(() => {
        setIsSidebarVisible(false)
        setIsDropdownMode(false)
      }, 200)
    }

    catalogButton.addEventListener('mouseenter', handleMouseEnter)
    catalogButton.addEventListener('mouseleave', handleMouseLeave)
    
    if (sidebarContainer) {
      sidebarContainer.addEventListener('mouseenter', handleSidebarEnter)
      sidebarContainer.addEventListener('mouseleave', handleSidebarLeave)
    }

    if (subcategoriesPanel) {
      subcategoriesPanel.addEventListener('mouseenter', handleSidebarEnter)
      subcategoriesPanel.addEventListener('mouseleave', handleSidebarLeave)
    }

    return () => {
      clearTimeout(timeoutId)
      catalogButton.removeEventListener('mouseenter', handleMouseEnter)
      catalogButton.removeEventListener('mouseleave', handleMouseLeave)
      if (sidebarContainer) {
        sidebarContainer.removeEventListener('mouseenter', handleSidebarEnter)
        sidebarContainer.removeEventListener('mouseleave', handleSidebarLeave)
      }
      if (subcategoriesPanel) {
        subcategoriesPanel.removeEventListener('mouseenter', handleSidebarEnter)
        subcategoriesPanel.removeEventListener('mouseleave', handleSidebarLeave)
      }
    }
  }, [isHomePage, isCatalogPage])


  // Обновляем CSS переменную для высоты сайдбара когда он выдвигается
  useEffect(() => {
    if (!containerRef.current) return

    const sidebarContainer = containerRef.current.querySelector('[class*="sidebarContainer"]') as HTMLElement
    const sidebarSections = containerRef.current.querySelector(`.${styles.sidebarSections}`) as HTMLElement

    if (!sidebarSections) return

    if (!isDropdownMode || !isSidebarVisible) {
      // Когда сайдбар скрывается, сбрасываем CSS переменную
      // CSS сам вернет top на правильное значение благодаря !important
      sidebarSections.style.setProperty('--sidebar-height', '0px')
      return
    }

    const updateSidebarHeight = () => {
      if (sidebarContainer) {
        const sidebarHeight = sidebarContainer.getBoundingClientRect().height
        sidebarSections.style.setProperty('--sidebar-height', `${sidebarHeight}px`)
      }
    }

    // Обновляем высоту сразу и после небольшой задержки (когда сайдбар отрендерится)
    updateSidebarHeight()
    const timeoutId = setTimeout(updateSidebarHeight, 100)
    const timeoutId2 = setTimeout(updateSidebarHeight, 300) // Дополнительная проверка

    // Также обновляем при изменении размера окна
    window.addEventListener('resize', updateSidebarHeight)

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(timeoutId2)
      window.removeEventListener('resize', updateSidebarHeight)
    }
  }, [isDropdownMode, isSidebarVisible])

  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${isSidebarVisible ? styles.sidebarVisible : ''} ${isDropdownMode ? styles.dropdownMode : ''}`}
    >
      <CatalogSidebar />
      <div className={styles.sidebarSections}>
        <SidebarSections />
      </div>
    </div>
  )
}

