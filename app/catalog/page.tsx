import Link from 'next/link'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { prisma } from '@/lib/db'
import { getCategoryProductCount, getSubcategoryImage } from '@/lib/categoryUtils'
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
      },
    },
    orderBy: {
      sortOrder: 'asc',
    },
  })

  // Подсчитываем товары для каждой подкатегории с учетом дочерних категорий
  // И получаем изображения подкатегорий из товаров
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      subcategoriesWithCounts: await Promise.all(
        category.other_Category.map(async (subcategory) => {
          // Получаем изображение подкатегории из товара, если у самой подкатегории нет изображения
          const subcategoryImage = subcategory.image || await getSubcategoryImage(subcategory.id)
          
          return {
            ...subcategory,
            image: subcategoryImage,
            productCount: await getCategoryProductCount(subcategory.id),
          }
        })
      ),
    }))
  )

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Каталог</h1>
        <div className={styles.grid}>
          {categoriesWithCounts.map((category) => (
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
              {category.subcategoriesWithCounts.length > 0 && (
                <div className={styles.subcategories}>
                  {category.subcategoriesWithCounts.map((subcategory) => (
                    <Link
                      key={subcategory.slug}
                      href={`/catalog/${category.slug}/${subcategory.slug}`}
                      className={styles.subcategoryItem}
                    >
                      {subcategory.image && (
                        <img
                          src={subcategory.image}
                          alt={subcategory.name}
                          className={styles.subcategoryImage}
                        />
                      )}
                      <span className={styles.subcategoryName}>
                        {subcategory.name}
                      </span>
                      {subcategory.productCount > 0 && (
                        <span className={styles.subcategoryCount}>
                          {subcategory.productCount}
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
