import { prisma } from '@/lib/db'
import { getAuthUserFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import styles from './page.module.scss'

export default async function AdminOrdersPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  if (!token) {
    redirect('/admin/login')
  }

  try {
    const user = await getAuthUserFromCookies(token)
    if (!user || user.role !== 'ADMIN') {
      redirect('/admin/login')
    }
  } catch {
    redirect('/admin/login')
  }

  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  })

  return (
    <div className={styles.page}>
      <h1>Заказы</h1>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Номер</th>
              <th>Клиент</th>
              <th>Email</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                </td>
                <td>
                  {order.user.firstName} {order.user.lastName}
                </td>
                <td>{order.user.email}</td>
                <td>{new Intl.NumberFormat('ru-RU').format(Number(order.total))} ₽</td>
                <td>
                  <span className={styles.status}>{order.status}</span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                <td>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className={styles.editLink}
                  >
                    Просмотр
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
