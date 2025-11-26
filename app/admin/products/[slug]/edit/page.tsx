import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getAuthUserFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { EditProductForm } from '@/components/admin/EditProductForm/EditProductForm'

export default async function EditProductPage({
  params,
}: {
  params: { slug: string }
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  if (!token) {
    redirect('/admin/login')
  }

  try {
    const user = await getAuthUserFromCookies(token)
    if (!user || user.role !== 'ADMIN') {
      redirect('/admin/login')
    }
  } catch {
    redirect('/admin/login')
  }

  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      categoryObj: true,
      variants: true,
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

