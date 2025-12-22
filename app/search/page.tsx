import { prisma } from '@/lib/db'
import { ProductGrid } from '@/components/organisms/ProductGrid/ProductGrid'
import styles from './page.module.scss'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { query?: string }
}) {
  const query = searchParams.query || ''
  let products: any[] = []
  let total = 0

  if (query) {
    const result = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
        visibility: 'VISIBLE',
      },
      include: {
        Category: true,
      },
      take: 20,
    })

    products = result.map((p) => ({
      ...p,
      badges: p.tags || [],
      stockStatus: p.isInStock ? (p.stock > 10 ? 'MANY' : p.stock > 0 ? 'ENOUGH' : 'FEW') : 'NONE',
    }))
    total = result.length
  }

  return (
    <main>
      <div className="container">
        <h1 className={styles.title}>
          {query ? `Результаты поиска по "${query}"` : 'Поиск'}
        </h1>
        {query && (
          <p className={styles.count}>Найдено: {total} товаров</p>
        )}

        {query && products.length > 0 && <ProductGrid products={products} />}

        {query && products.length === 0 && (
          <div className={styles.empty}>
            <p>Ничего не найдено</p>
            <p className={styles.suggestion}>
              Попробуйте изменить запрос или зайдите в{' '}
              <a href="/catalog">каталог</a>
            </p>
          </div>
        )}

        {!query && (
          <div className={styles.empty}>
            <p>Введите запрос для поиска</p>
          </div>
        )}
      </div>
    </main>
  )
}

