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
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Управление клиентами</h1>
          <p className={styles.subtitle}>Список всех клиентов магазина</p>
        </div>
      </div>

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
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  Клиенты не найдены
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td className={styles.id}>{customer.id.substring(0, 8)}...</td>
                  <td>
                    <div className={styles.customer}>
                      <span className={styles.customerName}>
                        {customer.firstName} {customer.lastName}
                      </span>
                    </div>
                  </td>
                  <td className={styles.email}>{customer.email}</td>
                  <td>{customer.phone || '-'}</td>
                  <td>{customer.role}</td>
                  <td>
                    <span
                      className={styles.status}
                      style={{
                        background: customer.isBlocked ? '#fee2e215' : '#d1fae515',
                        color: customer.isBlocked ? '#991b1b' : '#065f46',
                      }}
                    >
                      {customer.isBlocked ? 'Заблокирован' : 'Активен'}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className={styles.viewLink}
                    >
                      Редактировать
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

