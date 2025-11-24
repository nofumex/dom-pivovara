import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/atoms/Button/Button'
import styles from './page.module.scss'

export default async function AdminCategoriesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  if (!token) {
    redirect('/admin/login')
  }

  try {
    const user = await verifyAuth({ cookies: () => cookieStore } as any)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      redirect('/admin/login')
    }
  } catch {
    redirect('/admin/login')
  }

  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      _count: {
        select: { products: true },
      },
    },
    orderBy: {
      sortOrder: 'asc',
    },
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Категории</h1>
        <Link href="/admin/categories/create">
          <Button variant="primary">Создать категорию</Button>
        </Link>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Slug</th>
              <th>Родитель</th>
              <th>Товаров</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.slug}</td>
                <td>{category.parent?.name || '-'}</td>
                <td>{category._count.products}</td>
                <td>
                  <span
                    className={`${styles.status} ${
                      category.isActive ? styles.active : styles.inactive
                    }`}
                  >
                    {category.isActive ? 'Активна' : 'Неактивна'}
                  </span>
                </td>
                <td>
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className={styles.editLink}
                  >
                    Редактировать
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
