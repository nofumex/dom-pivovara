import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
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
        include: {
          _count: {
            select: {
              Product: {
                where: {
                  isActive: true,
                  visibility: 'VISIBLE',
                },
              },
            },
          },
        },
      },
    },
  })

  if (!targetCategory || !targetCategory.isActive) {
    notFound()
  }

  const categoryData = {
    id: targetCategory.id,
    name: targetCategory.name,
    slug: targetCategory.slug,
    parent: targetCategory.Category,
    children: targetCategory.other_Category.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      count: child._count.Product,
    })),
  }

  return <CategoryClient category={categoryData} initialProducts={[]} />
}

