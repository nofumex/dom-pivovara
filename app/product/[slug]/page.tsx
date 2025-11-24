import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { ProductDetails } from '@/components/organisms/ProductDetails/ProductDetails'
import { ProductTabs } from '@/components/organisms/ProductDetailsTabs/ProductDetailsTabs'

export default async function ProductPage({
  params,
}: {
  params: { slug: string }
}) {
  const product = await prisma.product.findUnique({
    where: {
      slug: params.slug,
      isActive: true,
      visibility: 'VISIBLE',
    },
    include: {
      categoryObj: {
        include: {
          parent: true,
        },
      },
      variants: {
        where: { isActive: true },
      },
      reviews: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        take: 10,
      },
    },
  })

  const productWithBadges = product ? {
    ...product,
    badges: product.tags || [],
    stockStatus: product.isInStock ? (product.stock > 10 ? 'MANY' : product.stock > 0 ? 'ENOUGH' : 'FEW') : 'NONE',
  } : null

  if (!product || !productWithBadges) {
    notFound()
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Каталог', href: '/catalog' },
    { label: product.categoryObj.parent?.name || product.categoryObj.name, href: `/catalog/${product.categoryObj.parent?.slug || product.categoryObj.slug}` },
    { label: product.categoryObj.name, href: `/catalog/${product.categoryObj.slug}` },
    { label: product.title, href: `/product/${product.slug}` },
  ]

  return (
    <main>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <ProductDetails product={productWithBadges} />
        <ProductTabs product={productWithBadges} />
      </div>
    </main>
  )
}
