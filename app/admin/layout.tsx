import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyAuth } from '@/lib/auth'
import Link from 'next/link'
import styles from './layout.module.scss'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  if (!token) {
    redirect('/admin/login')
  }

  let user = null
  try {
    user = await verifyAuth({ cookies: () => cookieStore } as any)
    if (!user || user.role !== 'ADMIN') {
      redirect('/admin/login')
    }
  } catch {
    redirect('/admin/login')
  }

  return (
    <div className={styles.admin}>
      <nav className={styles.nav}>
        <div className={styles.navHeader}>
          <h1 className={styles.navTitle}>Админ-панель</h1>
          <span className={styles.navUser}>
            {user?.firstName} {user?.lastName}
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
}
