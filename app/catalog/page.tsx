import Link from 'next/link'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { prisma } from '@/lib/db'
import { getPlaceholderImage } from '@/lib/catalogData'
import styles from './page.module.scss'

export default async function CatalogPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Каталог', href: '/catalog' },
  ]

  // Получаем все категории из базы данных
  const categories = await prisma.category.findMany({
    where: {
      parentId: null,
      isActive: true,
    },
    include: {
      other_Category: {
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
        include: {
          _count: {
            select: {
              Product: {
                where: {
                  isActive: true,
                  visibility: 'VISIBLE',
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          Product: {
            where: {
              isActive: true,
              visibility: 'VISIBLE',
            },
          },
        },
      },
    },
    orderBy: {
      sortOrder: 'asc',
    },
  })

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Каталог</h1>
        <div className={styles.grid}>
          {categories.map((category) => (
            <div key={category.slug} className={styles.card}>
            <Link
              href={`/catalog/${category.slug}`}
                className={styles.cardLink}
            >
                <img
                  src={category.image || getPlaceholderImage(category.name, 140)}
                  alt={category.name}
                className={styles.image}
              />
              <div className={styles.content}>
                <h2 className={styles.cardTitle}>{category.name}</h2>
                </div>
              </Link>
              {category.other_Category.length > 0 && (
                <div className={styles.subcategories}>
                  {category.other_Category.map((subcategory) => (
                    <Link
                      key={subcategory.slug}
                      href={`/catalog/${category.slug}/${subcategory.slug}`}
                      className={styles.subcategoryItem}
                    >
                      <span className={styles.subcategoryName}>
                        {subcategory.name}
                      </span>
                      {subcategory._count.Product > 0 && (
                        <span className={styles.subcategoryCount}>
                          {subcategory._count.Product}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                )}
              </div>
          ))}
        </div>
      </div>
    </main>
  )
}
