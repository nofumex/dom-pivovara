import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getCategoryProductCount } from '@/lib/categoryUtils'
import { CategoryClient } from '../CategoryClient'

export default async function SubcategoryPage({
  params,
}: {
  params: { slug: string; subslug: string }
}) {
  // Ищем категорию по последнему slug (subslug) - это может быть подкатегория или под-подкатегория
  // Игнорируем первый slug, так как он может быть любым родителем в иерархии
  const targetCategory = await prisma.category.findUnique({
    where: { slug: params.subslug },
    include: {
      Category: {
        select: {
          id: true,
          name: true,
          slug: true,
          Category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
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

  if (!targetCategory || !targetCategory.isActive) {
    notFound()
  }

  // Подсчитываем товары для каждой подкатегории с учетом дочерних категорий
  const childrenWithCounts = await Promise.all(
    targetCategory.other_Category.map(async (child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      count: await getCategoryProductCount(child.id),
    }))
  )

  const categoryData = {
    id: targetCategory.id,
    name: targetCategory.name,
    slug: targetCategory.slug,
    parent: targetCategory.Category,
    children: childrenWithCounts,
  }

  return <CategoryClient category={categoryData} initialProducts={[]} />
}

