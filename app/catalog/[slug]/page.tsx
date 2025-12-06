import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getCategoryProductCount } from '@/lib/categoryUtils'
import { CategoryClient } from './CategoryClient'

export default async function CategoryPage({
  params,
}: {
  params: { slug: string }
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      Category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      other_Category: {
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  })

  if (!category || !category.isActive) {
    notFound()
  }

  // Подсчитываем товары для каждой подкатегории с учетом дочерних категорий
  const childrenWithCounts = await Promise.all(
    category.other_Category.map(async (sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      count: await getCategoryProductCount(sub.id),
    }))
  )

  // Преобразуем структуру данных для CategoryClient
  const categoryData = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent: category.Category,
    children: childrenWithCounts,
  }

  return <CategoryClient category={categoryData} initialProducts={[]} />
}

