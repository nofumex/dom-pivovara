import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CategoryClient } from './CategoryClient'

export default async function CategoryPage({
  params,
}: {
  params: { slug: string }
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
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

  if (!category || !category.isActive) {
    notFound()
  }

  // Преобразуем структуру данных для CategoryClient
  const categoryData = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent: category.parent,
    children: category.children.map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      count: sub._count.products,
    })),
  }

  return <CategoryClient category={categoryData} initialProducts={[]} />
}

