import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { ProductDetails } from '@/components/organisms/ProductDetails/ProductDetails'
import { ProductDetailsTabs } from '@/components/organisms/ProductDetailsTabs/ProductDetailsTabs'

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

  if (!product) {
    notFound()
  }

  // Сериализуем данные для передачи в клиентские компоненты
  const productWithBadges = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    rating: product.rating ? Number(product.rating) : 0,
    badges: product.badges || [],
    images: product.images || [],
    stock: product.stock || 0,
    stockStatus: product.isInStock ? (product.stock > 10 ? 'MANY' : product.stock > 0 ? 'ENOUGH' : 'FEW') : 'NONE',
    reviews: product.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      createdAt: review.createdAt.toISOString(),
      user: {
        firstName: review.user.firstName,
        lastName: review.user.lastName,
      },
    })),
    description: product.description || '',
    content: product.content || '',
    sku: product.sku,
    weight: product.weight ? Number(product.weight) : undefined,
    dimensions: product.dimensions || undefined,
    material: product.material || undefined,
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
        <ProductDetailsTabs product={productWithBadges} />
      </div>
    </main>
  )
}
