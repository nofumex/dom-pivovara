import { notFound } from 'next/navigation'
import { allCategories } from '@/lib/catalogData'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { FiltersPanel } from '@/components/organisms/FiltersPanel/FiltersPanel'
import { SortBar } from '@/components/molecules/SortBar/SortBar'
import { ProductGrid } from '@/components/organisms/ProductGrid/ProductGrid'
import styles from './page.module.scss'

export default async function SubSubcategoryPage({
  params,
}: {
  params: { slug: string; subslug: string; subsubslug: string }
}) {
  const category = allCategories.find((cat) => cat.slug === params.slug)
  
  if (!category) {
    notFound()
  }

  const subcategory = category.subcategories.find((sub) => sub.slug === params.subslug)

  if (!subcategory) {
    notFound()
  }

  const subSubcategory = subcategory.subSubcategories?.find(
    (subSub) => subSub.slug === params.subsubslug
  )

  if (!subSubcategory) {
    notFound()
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Каталог', href: '/catalog' },
    { label: category.name, href: `/catalog/${params.slug}` },
    { label: subcategory.name, href: `/catalog/${params.slug}/${params.subslug}` },
    { label: subSubcategory.name, href: `/catalog/${params.slug}/${params.subslug}/${params.subsubslug}` },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>{subSubcategory.name}</h1>

        <FiltersPanel />
        <SortBar />
        <ProductGrid products={[]} />
      </div>
    </main>
  )
}


