import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/organisms/Header/Header'
import { Footer } from '@/components/organisms/Footer/Footer'
import { RightDock } from '@/components/organisms/RightDock/RightDock'
import { LeftCatalog } from '@/components/organisms/LeftCatalog/LeftCatalog'
import { ScrollToTop } from '@/components/atoms/ScrollToTop/ScrollToTop'
import '@/styles/globals.scss'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'ДомПивовар - Интернет-магазин товаров для пивоварения',
  description: 'Интернет-магазин товаров для пивоварения, самогоноварения и виноделия',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Header />
        <div style={{ display: 'flex' }}>
          <LeftCatalog />
          <div style={{ flex: 1 }}>
            {children}
          </div>
        </div>
        <Footer />
        <RightDock />
        <ScrollToTop />
      </body>
    </html>
  )
}

