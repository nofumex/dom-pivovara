import { prisma } from '@/lib/db'

/**
 * Recursively gets all child category IDs for a given category
 * Оптимизированная версия: получает все категории одним запросом
 */
export async function getAllChildCategoryIds(categoryId: string): Promise<string[]> {
  // Получаем все категории одним запросом
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
  
  // Рекурсивно получаем все дочерние категории
  const getAllChildren = (id: string): string[] => {
    const children = categoryTree.get(id) || []
    const allChildren = [...children]
    for (const childId of children) {
      allChildren.push(...getAllChildren(childId))
    }
    return allChildren
  }
  
  return getAllChildren(categoryId)
}

/**
 * Gets the total count of products in a category, including all child categories
 * @param categoryId - The ID of the category
 * @returns The total count of active products in the category and all its subcategories
 */
export async function getCategoryProductCount(categoryId: string): Promise<number> {
  // Get all child category IDs
  const childCategoryIds = await getAllChildCategoryIds(categoryId)
  
  // Count products in the category and all its children
  const count = await prisma.product.count({
    where: {
      categoryId: {
        in: [categoryId, ...childCategoryIds],
      },
      isActive: true,
      visibility: 'VISIBLE',
    },
  })

  return count
}

/**
 * Gets an image from a product in the category (or its subcategories)
 * @param categoryId - The ID of the category
 * @returns The first image URL from the first product found, or null if no image is found
 */
export async function getSubcategoryImage(categoryId: string): Promise<string | null> {
  // Get all child category IDs
  const childCategoryIds = await getAllChildCategoryIds(categoryId)
  
  // Find the first product with an image in this category or its children
  const product = await prisma.product.findFirst({
    where: {
      categoryId: {
        in: [categoryId, ...childCategoryIds],
      },
      isActive: true,
      visibility: 'VISIBLE',
      images: {
        isEmpty: false,
      },
    },
    select: {
      images: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Return the first image if found
  if (product && product.images && product.images.length > 0) {
    return product.images[0]
  }

  return null
}
