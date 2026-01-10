import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs/Breadcrumbs'
import { ProductDetails } from '@/components/organisms/ProductDetails/ProductDetails'
import { ProductDetailsTabs } from '@/components/organisms/ProductDetailsTabs/ProductDetailsTabs'
import { ProductViewTracker } from '@/components/organisms/ProductDetails/ProductViewTracker'

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
      Category: {
        include: {
          Category: true,
        },
      },
      ProductVariant: {
        where: { isActive: true },
      },
      Review: {
        where: { isActive: true },
        include: {
          User: {
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
    stockStatus: product.isInStock ? (product.stock === 0 ? 'NONE' : product.stock >= 1 && product.stock <= 2 ? 'FEW' : product.stock >= 3 && product.stock <= 10 ? 'ENOUGH' : 'MANY') : 'NONE',
    reviews: product.Review.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      createdAt: review.createdAt.toISOString(),
      user: {
        firstName: review.User.firstName,
        lastName: review.User.lastName,
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
    { label: product.Category.Category?.name || product.Category.name, href: `/catalog/${product.Category.Category?.slug || product.Category.slug}` },
    { label: product.Category.name, href: `/catalog/${product.Category.slug}` },
    { label: product.title, href: `/product/${product.slug}` },
  ]

  return (
    <main>
      <ProductViewTracker productId={product.id} />
      <div className="container">
        <Breadcrumbs items={breadcrumbs} />
        <ProductDetails product={productWithBadges} />
        <ProductDetailsTabs product={productWithBadges} />
      </div>
    </main>
  )
}
