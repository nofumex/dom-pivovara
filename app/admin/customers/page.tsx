import { prisma } from '@/lib/db'
import { getAuthUserWithRefresh } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.scss'

export default async function AdminCustomersPage() {
  const { user } = await getAuthUserWithRefresh()

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  const customers = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  })

  return (
    <div className={styles.page}>
      <h1>Клиенты</h1>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id.substring(0, 8)}...</td>
                <td>
                  {customer.firstName} {customer.lastName}
                </td>
                <td>{customer.email}</td>
                <td>{customer.phone || '-'}</td>
                <td>{customer.role}</td>
                <td>
                  <span
                    className={`${styles.status} ${
                      customer.isBlocked ? styles.blocked : styles.active
                    }`}
                  >
                    {customer.isBlocked ? 'Заблокирован' : 'Активен'}
                  </span>
                </td>
                <td>
                  <Link
                    href={`/admin/customers/${customer.id}`}
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

