import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getAuthUserWithRefresh } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { EditProductForm } from '@/components/admin/EditProductForm/EditProductForm'

export default async function EditProductPage({
  params,
}: {
  params: { slug: string }
}) {
  const { user } = await getAuthUserWithRefresh()

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
      include: {
        Category: true,
        ProductVariant: true,
        Review: {
          include: {
            User: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
  })

  if (!product) {
    notFound()
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return <EditProductForm product={product} categories={categories} />
}

