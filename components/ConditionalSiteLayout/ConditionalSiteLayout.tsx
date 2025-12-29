'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/organisms/Header/Header'
import { Footer } from '@/components/organisms/Footer/Footer'
import { RightDock } from '@/components/organisms/RightDock/RightDock'
import { CatalogSidebar } from '@/components/organisms/CatalogSidebar/CatalogSidebar'
import { PageWrapper } from '@/components/organisms/PageWrapper/PageWrapper'
import { ScrollToTop } from '@/components/atoms/ScrollToTop/ScrollToTop'
import { CookieBanner } from '@/components/molecules/CookieBanner/CookieBanner'

interface ConditionalSiteLayoutProps {
  children: React.ReactNode
}

export function ConditionalSiteLayout({ children }: ConditionalSiteLayoutProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin') ?? false

  // Для админ-панели не показываем Header, Footer и другие компоненты сайта
  if (isAdminRoute) {
    return <>{children}</>
  }

  // Для обычных страниц показываем полный layout
  return (
    <>
      <Header />
      <div className="layout-container">
        <CatalogSidebar />
        <PageWrapper>
          {children}
        </PageWrapper>
      </div>
      <Footer />
      <RightDock />
      <ScrollToTop />
      <CookieBanner />
    </>
  )
}

