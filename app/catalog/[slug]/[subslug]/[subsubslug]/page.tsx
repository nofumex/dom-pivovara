import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CategoryClient } from '../../CategoryClient'

export default async function SubSubcategoryPage({
  params,
}: {
  params: { slug: string; subslug: string; subsubslug: string }
}) {
  // Ищем категорию по последнему slug (subsubslug)
  // Игнорируем промежуточные slug'ы, так как они могут быть любыми родителями в иерархии
  const targetCategory = await prisma.category.findUnique({
    where: { slug: params.subsubslug },
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




