import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { ProductGrid } from '@/components/organisms/ProductGrid/ProductGrid'
import { prisma } from '@/lib/db'
import styles from './page.module.scss'

export default async function SalesPage() {
  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Акции', href: '/sales' },
  ]

  const products = await prisma.product.findMany({
    where: {
      tags: { has: 'SALE' },
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

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>Акции</h1>
        <ProductGrid products={productsWithBadges} />
      </div>
    </main>
  )
}

