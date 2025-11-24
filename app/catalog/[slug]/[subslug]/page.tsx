import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
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
  const subcategory = await prisma.category.findUnique({
    where: { slug: params.subslug },
    include: {
      parent: true,
    },
  })

  if (!subcategory || subcategory.parent?.slug !== params.slug) {
    notFound()
  }

  const products = await prisma.product.findMany({
    where: {
      categoryId: subcategory.id,
      isActive: true,
      visibility: 'VISIBLE',
    },
    include: {
      categoryObj: true,
    },
    take: 20,
  })

  const productsWithBadges = products.map((p) => ({
    ...p,
    badges: p.tags || [],
    stockStatus: p.isInStock ? (p.stock > 10 ? 'MANY' : p.stock > 0 ? 'ENOUGH' : 'FEW') : 'NONE',
  }))

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Каталог', href: '/catalog' },
    { label: subcategory.parent?.name || '', href: `/catalog/${params.slug}` },
    { label: subcategory.name, href: `/catalog/${params.slug}/${params.subslug}` },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>{subcategory.name}</h1>

        <FiltersPanel />
        <SortBar />
        <ProductGrid products={productsWithBadges} />
      </div>
    </main>
  )
}

