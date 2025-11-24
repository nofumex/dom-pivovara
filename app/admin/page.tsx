import { prisma } from '@/lib/db'
import { verifyAuth, verifyRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import styles from './page.module.scss'

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  if (!token) {
    redirect('/admin/login')
  }

  try {
    const user = await verifyAuth({ cookies: () => cookieStore } as any)
    if (!user || user.role !== 'ADMIN') {
      redirect('/admin/login')
    }
  } catch {
    redirect('/admin/login')
  }

  const [
    totalUsers,
    totalOrders,
    totalProducts,
    totalRevenue,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: 'CANCELLED' } },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
  ])

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Панель управления</h1>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>Пользователи</h3>
          <p className={styles.statValue}>{totalUsers}</p>
          <Link href="/admin/customers" className={styles.statLink}>
            Управление →
          </Link>
        </div>

        <div className={styles.statCard}>
          <h3>Заказы</h3>
          <p className={styles.statValue}>{totalOrders}</p>
          <Link href="/admin/orders" className={styles.statLink}>
            Управление →
          </Link>
        </div>

        <div className={styles.statCard}>
          <h3>Товары</h3>
          <p className={styles.statValue}>{totalProducts}</p>
          <Link href="/admin/products" className={styles.statLink}>
            Управление →
          </Link>
        </div>

        <div className={styles.statCard}>
          <h3>Выручка</h3>
          <p className={styles.statValue}>
            {new Intl.NumberFormat('ru-RU').format(
              Number(totalRevenue._sum.total || 0)
            )}{' '}
            ₽
          </p>
        </div>
      </div>

      <div className={styles.recentOrders}>
        <h2>Последние заказы</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Номер</th>
              <th>Клиент</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                </td>
                <td>
                  {order.user.firstName} {order.user.lastName}
                </td>
                <td>{new Intl.NumberFormat('ru-RU').format(Number(order.total))} ₽</td>
                <td>
                  <span className={styles.status}>{order.status}</span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
