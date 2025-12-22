import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ConditionalSiteLayout } from '@/components/ConditionalSiteLayout/ConditionalSiteLayout'
import { AdminBodyStyles } from '@/components/AdminBodyStyles/AdminBodyStyles'
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AdminBodyStyles />
        <AuthSync />
        <ConditionalSiteLayout>
          {children}
        </ConditionalSiteLayout>
      </body>
    </html>
  )
}

