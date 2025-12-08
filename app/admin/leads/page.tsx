import { prisma } from '@/lib/db'
import { getAuthUserWithRefresh } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import styles from './page.module.scss'

export default async function AdminLeadsPage() {
  const { user } = await getAuthUserWithRefresh()

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  const leads = await prisma.lead.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      NEW: { bg: '#dbeafe15', color: '#1e40af' },
      PROCESSED: { bg: '#d1fae515', color: '#065f46' },
      CLOSED: { bg: '#f3f4f615', color: '#374151' },
    }
    return colors[status] || { bg: '#f3f4f615', color: '#374151' }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: 'Новая',
      PROCESSED: 'Обработана',
      CLOSED: 'Закрыта',
    }
    return labels[status] || status
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Управление заявками</h1>
          <p className={styles.subtitle}>Список всех заявок магазина</p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Категория</th>
              <th>Сообщение</th>
              <th>Статус</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Заявки не найдены
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const statusStyle = getStatusColor(lead.status)
                const sourceLabels: Record<string, string> = {
                  CHEAPER: 'Нашли дешевле',
                  CONTACT: 'Обратная связь',
                  CALLBACK: 'Заказ звонка',
                  QUESTION: 'Вопрос',
                  OTHER: 'Другое',
                }
                return (
                  <tr key={lead.id}>
                    <td className={styles.id}>
                      <a href={`/admin/leads/${lead.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {lead.id.substring(0, 8)}...
                      </a>
                    </td>
                    <td>{lead.name || '-'}</td>
                    <td>{lead.phone || '-'}</td>
                    <td className={styles.email}>{lead.email || '-'}</td>
                    <td className={styles.source}>
                      {lead.source ? sourceLabels[lead.source] || lead.source : '-'}
                    </td>
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
                        className={styles.status}
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    <td className={styles.date}>
                      {new Date(lead.createdAt).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


