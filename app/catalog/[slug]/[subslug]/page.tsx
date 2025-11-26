import { notFound } from 'next/navigation'
import Link from 'next/link'
import { allCategories, getPlaceholderImage } from '@/lib/catalogData'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { FiltersPanel } from '@/components/organisms/FiltersPanel/FiltersPanel'
import { SortBar } from '@/components/molecules/SortBar/SortBar'
import { ProductGrid } from '@/components/organisms/ProductGrid/ProductGrid'
import styles from './page.module.scss'

export default async function SubcategoryPage({
  params,
}: {
  params: { slug: string; subslug: string }
}) {
  const category = allCategories.find((cat) => cat.slug === params.slug)
  
  if (!category) {
    notFound()
  }

  const subcategory = category.subcategories.find((sub) => sub.slug === params.subslug)

  if (!subcategory) {
    notFound()
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Каталог', href: '/catalog' },
    { label: category.name, href: `/catalog/${params.slug}` },
    { label: subcategory.name, href: `/catalog/${params.slug}/${params.subslug}` },
  ]

  const hasSubSubcategories = subcategory.subSubcategories && subcategory.subSubcategories.length > 0

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>{subcategory.name}</h1>

        {hasSubSubcategories && (
          <div className={styles.subSubcategoriesSection}>
            <div className={styles.subSubcategoriesGrid}>
              {subcategory.subSubcategories.map((subSubcategory) => (
                <Link
                  key={subSubcategory.slug}
                  href={`/catalog/${params.slug}/${params.subslug}/${subSubcategory.slug}`}
                  className={styles.subSubcategoryCard}
                >
                  <img
                    src={getPlaceholderImage(subSubcategory.name, 64)}
                    alt={subSubcategory.name}
                    className={styles.subSubcategoryImage}
                  />
                  <div className={styles.subSubcategoryInfo}>
                    <span className={styles.subSubcategoryName}>
                      {subSubcategory.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <FiltersPanel />
        <SortBar />
        <ProductGrid products={[]} />
      </div>
    </main>
  )
}

