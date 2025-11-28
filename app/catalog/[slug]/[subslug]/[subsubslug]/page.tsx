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
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      children: {
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
        include: {
          _count: {
            select: {
              products: {
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
    parent: targetCategory.parent,
    children: targetCategory.children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      count: child._count.products,
    })),
  }

  return <CategoryClient category={categoryData} initialProducts={[]} />
}




