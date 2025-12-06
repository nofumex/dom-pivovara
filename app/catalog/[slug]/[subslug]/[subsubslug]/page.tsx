import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getCategoryProductCount, getSubcategoryImage } from '@/lib/categoryUtils'
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
      },
    },
  })

  if (!targetCategory || !targetCategory.isActive) {
    notFound()
  }

  // Подсчитываем товары для каждой подкатегории с учетом дочерних категорий
  // И получаем изображения подкатегорий из товаров
  const childrenWithCounts = await Promise.all(
    targetCategory.other_Category.map(async (child) => {
      // Получаем изображение подкатегории из товара, если у самой подкатегории нет изображения
      const subcategoryImage = child.image || await getSubcategoryImage(child.id)
      
      return {
        id: child.id,
        name: child.name,
        slug: child.slug,
        image: subcategoryImage,
        count: await getCategoryProductCount(child.id),
      }
    })
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




