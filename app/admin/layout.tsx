import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAuthUserFromCookies } from '@/lib/auth'
import Link from 'next/link'
import styles from './layout.module.scss'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  // Если токена нет, просто рендерим children (для страницы login)
  // Проверка аутентификации будет в самой странице
  if (!token) {
    return <>{children}</>
  }

  // Если токен есть, проверяем аутентификацию
  try {
    const user = await getAuthUserFromCookies(token)
    
    // Если пользователь не админ, редиректим на login
    if (!user || user.role !== 'ADMIN') {
      redirect('/admin/login')
    }

    // Рендерим layout с навигацией для авторизованных пользователей
    return (
      <div className={styles.admin}>
        <nav className={styles.nav}>
          <div className={styles.navHeader}>
            <h1 className={styles.navTitle}>Админ-панель</h1>
            <span className={styles.navUser}>
              {user.firstName} {user.lastName}
            </span>
          </div>
          <div className={styles.navLinks}>
            <Link href="/admin" className={styles.navLink}>
              Dashboard
            </Link>
            <Link href="/admin/products" className={styles.navLink}>
              Товары
            </Link>
            <Link href="/admin/orders" className={styles.navLink}>
              Заказы
            </Link>
            <Link href="/admin/categories" className={styles.navLink}>
              Категории
            </Link>
            <Link href="/admin/customers" className={styles.navLink}>
              Клиенты
            </Link>
            <Link href="/admin/leads" className={styles.navLink}>
              Заявки
            </Link>
            <Link href="/admin/settings" className={styles.navLink}>
              Настройки
            </Link>
            <Link href="/" className={styles.navLink}>
              На сайт
            </Link>
          </div>
        </nav>
        <main className={styles.main}>{children}</main>
      </div>
    )
  } catch (error) {
    console.error('Auth error in admin layout:', error)
    // При ошибке просто рендерим children (для страницы login)
    return <>{children}</>
  }
}
