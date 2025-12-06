import { prisma } from './db'

/**
 * Рекурсивно получает все ID дочерних категорий для заданной категории
 */
export async function getAllChildCategoryIds(categoryId: string): Promise<string[]> {
  const childCategories = await prisma.category.findMany({
    where: {
      parentId: categoryId,
      isActive: true,
    },
    select: {
      id: true,
    },
  })

  const allIds = [categoryId]
  
  for (const child of childCategories) {
    const nestedIds = await getAllChildCategoryIds(child.id)
    allIds.push(...nestedIds)
  }

  return allIds
}

/**
 * Подсчитывает количество товаров в категории, включая товары из всех дочерних категорий
 */
export async function getCategoryProductCount(categoryId: string): Promise<number> {
  const allCategoryIds = await getAllChildCategoryIds(categoryId)
  
  const count = await prisma.product.count({
    where: {
      categoryId: {
        in: allCategoryIds,
      },
      isActive: true,
      visibility: 'VISIBLE',
    },
  })

  return count
}

/**
 * Подсчитывает количество товаров для массива категорий (оптимизированная версия)
 */
export async function getCategoriesProductCounts(categoryIds: string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  
  // Получаем все дочерние категории для каждой категории
  const allCategoryIdsMap = new Map<string, string[]>()
  
  for (const categoryId of categoryIds) {
    const allIds = await getAllChildCategoryIds(categoryId)
    allCategoryIdsMap.set(categoryId, allIds)
  }
  
  // Собираем все уникальные ID категорий
  const allUniqueIds = new Set<string>()
  allCategoryIdsMap.forEach((ids) => {
    ids.forEach((id) => allUniqueIds.add(id))
  })
  
  // Подсчитываем товары для каждой категории
  for (const categoryId of categoryIds) {
    const categoryIdsForCount = allCategoryIdsMap.get(categoryId) || []
    const count = await prisma.product.count({
      where: {
        categoryId: {
          in: categoryIdsForCount,
        },
        isActive: true,
        visibility: 'VISIBLE',
      },
    })
    counts[categoryId] = count
  }
  
  return counts
}
