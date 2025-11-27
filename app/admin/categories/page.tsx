import { prisma } from '@/lib/db'
import { getAuthUserWithRefresh } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { CategoryTreeManager } from '@/components/admin/CategoryTreeManager/CategoryTreeManager'

export default async function AdminCategoriesPage() {
  const { user } = await getAuthUserWithRefresh()

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  const categories = await prisma.category.findMany({
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          sortOrder: true,
          isActive: true,
          _count: {
            select: { products: true },
          },
        },
      },
      _count: {
        select: { products: true },
      },
    },
    orderBy: {
      sortOrder: 'asc',
    },
  })

  return <CategoryTreeManager categories={categories} />
}
