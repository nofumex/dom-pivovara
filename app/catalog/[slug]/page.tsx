import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { CategoryClient } from './CategoryClient'

export default async function CategoryPage({
  params,
}: {
  params: { slug: string }
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      parent: true,
      children: {
        where: { isActive: true },
      },
    },
  })

  if (!category) {
    notFound()
  }

  const products = await prisma.product.findMany({
    where: {
      categoryId: category.id,
      isActive: true,
      visibility: 'VISIBLE',
    },
    include: {
      categoryObj: true,
    },
    take: 50,
  })

  const productsWithBadges = products.map((p) => ({
    ...p,
    badges: p.tags || [],
    stockStatus: p.stockStatus || (p.isInStock ? (p.stock > 10 ? 'MANY' : p.stock > 0 ? 'ENOUGH' : 'FEW') : 'NONE'),
    rating: p.rating ? Number(p.rating) : 0,
  }))

  return <CategoryClient category={category} initialProducts={productsWithBadges} />
}

