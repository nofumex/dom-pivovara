import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/atoms/Button/Button'
import styles from './page.module.scss'

export default async function AdminProductsPage() {
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

  const products = await prisma.product.findMany({
    include: {
      categoryObj: {
        select: {
          name: true,
          slug: true,
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
      <div className={styles.header}>
        <h1>Товары</h1>
        <Link href="/admin/products/create">
          <Button variant="primary">Создать товар</Button>
        </Link>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.sku}</td>
                <td>
                  <Link href={`/admin/products/${product.slug}/edit`}>
                    {product.title}
                  </Link>
                </td>
                <td>{product.categoryObj.name}</td>
                <td>{new Intl.NumberFormat('ru-RU').format(Number(product.price))} ₽</td>
                <td>{product.stock}</td>
                <td>
                  <span
                    className={`${styles.status} ${
                      product.isActive ? styles.active : styles.inactive
                    }`}
                  >
                    {product.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <Link
                      href={`/admin/products/${product.slug}/edit`}
                      className={styles.editLink}
                    >
                      Редактировать
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
