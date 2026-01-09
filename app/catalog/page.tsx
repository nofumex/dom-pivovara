import Link from 'next/link'
import Image from 'next/image'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { prisma } from '@/lib/db'
import { getCategoryProductCount, getSubcategoryImage } from '@/lib/categoryUtils'
import { getPlaceholderImage } from '@/lib/catalogData'
import styles from './page.module.scss'

// Кешируем страницу на 5 минут
export const revalidate = 300

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

  // Упрощаем: не загружаем счетчики и изображения для главной страницы каталога
  // Это ускорит загрузку и уменьшит нагрузку на БД
  // Счетчики и изображения будут загружаться на страницах категорий
  const categoriesWithCounts = categories.map((category) => ({
    ...category,
    subcategoriesWithCounts: category.other_Category.map((subcategory) => ({
      ...subcategory,
      image: subcategory.image || null, // Используем только существующие изображения
      productCount: 0, // Не загружаем счетчики на главной странице
    })),
  }))

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
                <Image
                  src={category.image || getPlaceholderImage(category.name, 140)}
                  alt={category.name}
                  width={280}
                  height={140}
                  className={styles.image}
                  loading="lazy"
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
                        <Image
                          src={subcategory.image}
                          alt={subcategory.name}
                          width={40}
                          height={40}
                          className={styles.subcategoryImage}
                          loading="lazy"
                        />
                      )}
                      <span className={styles.subcategoryName}>
                        {subcategory.name}
                      </span>
                      {/* Счетчики товаров не показываем на главной странице для оптимизации */}
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
