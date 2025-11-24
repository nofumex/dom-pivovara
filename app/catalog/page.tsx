import { prisma } from '@/lib/db'
import Link from 'next/link'
import styles from './page.module.scss'

export default async function CatalogPage() {
  const categories = await prisma.category.findMany({
    where: {
      parentId: null,
      isActive: true,
    },
    include: {
      children: {
        where: { isActive: true },
        include: {
          _count: {
            select: { products: true },
          },
        },
      },
      _count: {
        select: { products: true },
      },
    },
    orderBy: {
      sortOrder: 'asc',
    },
  })

  return (
    <main>
      <div className="container">
        <h1 className={styles.title}>Каталог</h1>
        <div className={styles.grid}>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog/${category.slug}`}
              className={styles.card}
            >
              <div
                className={styles.image}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              />
              <div className={styles.content}>
                <h2 className={styles.cardTitle}>{category.name}</h2>
                {category.children && category.children.length > 0 && (
                  <ul className={styles.subcategories}>
                    {category.children.map((child) => (
                      <li key={child.id}>
                        {child.name} {child._count.products > 0 && `(${child._count.products})`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
