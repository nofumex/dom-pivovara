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
      },
    },
  })

  if (!targetCategory || !targetCategory.isActive) {
    notFound()
  }

  // Оптимизация по аналогии с CategoryPage: считаем товары и получаем изображения батчем
  const subcategoryIds = targetCategory.other_Category.map(sub => sub.id)

  // Получаем все категории одним запросом для построения дерева
  const allCategories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, parentId: true },
  })

  // Строим мапу parentId -> children
  const categoryTree = new Map<string, string[]>()
  for (const cat of allCategories) {
    if (cat.parentId) {
      if (!categoryTree.has(cat.parentId)) {
        categoryTree.set(cat.parentId, [])
      }
      categoryTree.get(cat.parentId)!.push(cat.id)
    }
  }

  // Функция для получения всех дочерних категорий из дерева
  const getAllChildrenFromTree = (categoryId: string): string[] => {
    const children = categoryTree.get(categoryId) || []
    const allChildren = [...children]
    for (const childId of children) {
      allChildren.push(...getAllChildrenFromTree(childId))
    }
    return allChildren
  }

  // Получаем все дочерние категории для всех подкатегорий
  const allChildCategoryIdsMap = new Map<string, string[]>()
  for (const subId of subcategoryIds) {
    const childIds = getAllChildrenFromTree(subId)
    allChildCategoryIdsMap.set(subId, [subId, ...childIds])
  }

  // Получаем все изображения одним запросом (только для тех, у кого нет изображения)
  const subcategoriesWithoutImages = targetCategory.other_Category.filter(sub => !sub.image)
  const subcategoryIdsWithoutImages = subcategoriesWithoutImages.map(sub => sub.id)

  const imagesMap = new Map<string, string | null>()
  if (subcategoryIdsWithoutImages.length > 0) {
    const allCategoryIdsForImages = Array.from(
      new Set(
        subcategoryIdsWithoutImages.flatMap(id => allChildCategoryIdsMap.get(id) || [id])
      )
    )

    const productsWithImages = await prisma.product.findMany({
      where: {
        categoryId: { in: allCategoryIdsForImages },
        isActive: true,
        visibility: 'VISIBLE',
        images: { isEmpty: false },
      },
      select: {
        categoryId: true,
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const categoryImageMap = new Map<string, string>()
    for (const product of productsWithImages) {
      if (product.images && product.images.length > 0 && !categoryImageMap.has(product.categoryId)) {
        categoryImageMap.set(product.categoryId, product.images[0])
      }
    }

    for (const subId of subcategoryIdsWithoutImages) {
      const childIds = allChildCategoryIdsMap.get(subId) || [subId]
      let foundImage: string | null = null
      for (const childId of childIds) {
        if (categoryImageMap.has(childId)) {
          foundImage = categoryImageMap.get(childId)!
          break
        }
      }
      imagesMap.set(subId, foundImage)
    }
  }

  // Получаем все счетчики одним запросом
  const allCategoryIdsForCounts = Array.from(
    new Set(
      subcategoryIds.flatMap(id => allChildCategoryIdsMap.get(id) || [id])
    )
  )

  const productCounts = await prisma.product.groupBy({
    by: ['categoryId'],
    where: {
      categoryId: { in: allCategoryIdsForCounts },
      isActive: true,
      visibility: 'VISIBLE',
    },
    _count: true,
  })

  const categoryCountMap = new Map<string, number>()
  for (const item of productCounts) {
    categoryCountMap.set(item.categoryId, item._count)
  }

  const childrenWithCounts = targetCategory.other_Category.map((sub) => {
    const childIds = allChildCategoryIdsMap.get(sub.id) || [sub.id]
    const count = childIds.reduce((sum, childId) => {
      return sum + (categoryCountMap.get(childId) || 0)
    }, 0)

    const subcategoryImage = sub.image || imagesMap.get(sub.id) || null

    return {
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      image: subcategoryImage,
      count,
    }
  })

  const categoryData = {
    id: targetCategory.id,
    name: targetCategory.name,
    slug: targetCategory.slug,
    parent: targetCategory.Category,
    children: childrenWithCounts,
  }

  return <CategoryClient category={categoryData} initialProducts={[]} />
}




