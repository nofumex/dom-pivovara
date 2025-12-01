import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { Header } from '@/components/organisms/Header/Header'
import { Footer } from '@/components/organisms/Footer/Footer'
import { RightDock } from '@/components/organisms/RightDock/RightDock'
import { CatalogSidebar } from '@/components/organisms/CatalogSidebar/CatalogSidebar'
import { PageWrapper } from '@/components/organisms/PageWrapper/PageWrapper'
import { ScrollToTop } from '@/components/atoms/ScrollToTop/ScrollToTop'
import { AuthSync } from '@/components/AuthSync/AuthSync'
import '@/styles/globals.scss'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'ДомПивовар - Интернет-магазин товаров для пивоварения',
  description: 'Интернет-магазин товаров для пивоварения, самогоноварения и виноделия',
  icons: {
    icon: '/images/logoPivovar.png',
    apple: '/images/logoPivovar.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isAdminRoute = pathname.startsWith('/admin')

  // Для админ-панели не показываем Header, Footer и другие компоненты сайта
  if (isAdminRoute) {
    return (
      <html lang="ru" style={{ margin: 0, padding: 0 }}>
        <body className={inter.className} style={{ margin: 0, padding: 0, overflow: 'hidden', width: '100vw', height: '100vh' }}>
          {children}
        </body>
      </html>
    )
  }

  // Для обычных страниц показываем полный layout
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthSync />
        <Header />
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <CatalogSidebar />
          <PageWrapper>
            {children}
          </PageWrapper>
        </div>
        <Footer />
        <RightDock />
        <ScrollToTop />
      </body>
    </html>
  )
}

