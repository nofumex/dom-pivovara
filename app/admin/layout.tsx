import { cookies } from 'next/headers'
import { getAuthUserFromCookies, verifyRefreshToken, validateSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar/AdminSidebar'
import { ScrollToTop } from '@/components/atoms/ScrollToTop/ScrollToTop'
import { AuthSync } from '@/components/AuthSync/AuthSync'
import styles from './layout.module.scss'

// Полностью отдельный layout для админки - переопределяет root layout
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  const refreshToken = cookieStore.get('refreshToken')?.value

  let user = null

  // Проверяем accessToken
  if (accessToken) {
    user = await getAuthUserFromCookies(accessToken)
  }

  // Если accessToken невалиден, проверяем refreshToken
  if (!user && refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken)
      if (payload) {
        const isValidSession = await validateSession(refreshToken)
        if (isValidSession) {
          user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              phone: true,
              company: true,
              isBlocked: true,
            },
          })
        }
      }
    } catch (error) {
      console.error('Error validating refresh token:', error)
    }
  }

  // Если пользователь не авторизован или не админ, редиректим на /login
  // Но только если нет refreshToken (чтобы избежать бесконечного цикла)
  if (!user || user.isBlocked || user.role !== 'ADMIN') {
    // Если есть refreshToken, возможно токен просто истек - не редиректим сразу
    if (!refreshToken) {
      redirect('/login')
    } else {
      // Если есть refreshToken, но пользователь не найден - редиректим
      redirect('/login')
    }
  }

  // Полностью отдельный layout без Header/Footer/Sidebar сайта
  return (
    <div className={styles.adminContainer}>
      <AuthSync />
      <AdminSidebar user={user} />
      <div className={styles.adminContent}>
        <main id="admin-main" className={styles.main}>
          {children}
        </main>
      </div>
      <ScrollToTop targetId="admin-main" />
    </div>
  )
}
