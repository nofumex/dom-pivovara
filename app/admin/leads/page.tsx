import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import styles from './page.module.scss'

export default async function AdminLeadsPage() {
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

  const leads = await prisma.lead.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  })

  return (
    <div className={styles.page}>
      <h1>Заявки</h1>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Тип</th>
              <th>Имя</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Сообщение</th>
              <th>Статус</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.id.substring(0, 8)}...</td>
                <td>{lead.type}</td>
                <td>{lead.name || '-'}</td>
                <td>{lead.phone || '-'}</td>
                <td>{lead.email || '-'}</td>
                <td className={styles.message}>
                  {lead.message ? (
                    lead.message.length > 50
                      ? `${lead.message.substring(0, 50)}...`
                      : lead.message
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <span
                    className={`${styles.status} ${
                      lead.status === 'NEW'
                        ? styles.new
                        : lead.status === 'PROCESSED'
                        ? styles.processed
                        : styles.closed
                    }`}
                  >
                    {lead.status === 'NEW'
                      ? 'Новая'
                      : lead.status === 'PROCESSED'
                      ? 'Обработана'
                      : 'Закрыта'}
                  </span>
                </td>
                <td>{new Date(lead.createdAt).toLocaleDateString('ru-RU')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

