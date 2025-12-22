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

/**
 * Получает изображение для подкатегории из первого товара с изображением
 * Возвращает первое изображение первого товара в категории, у которого есть изображения
 */
export async function getSubcategoryImage(categoryId: string): Promise<string | null> {
  try {
    // Получаем все ID категорий (сама категория + все дочерние)
    const allCategoryIds = await getAllChildCategoryIds(categoryId)
    
    if (allCategoryIds.length === 0) {
      console.warn(`[getSubcategoryImage] Нет категорий для поиска изображения (categoryId: ${categoryId})`)
      return null
    }
    
    console.log(`[getSubcategoryImage] Ищем товары с изображениями в категориях:`, allCategoryIds)
    
    // Сначала проверим, сколько всего товаров в этих категориях
    const totalProducts = await prisma.product.count({
      where: {
        categoryId: {
          in: allCategoryIds,
        },
        isActive: true,
        visibility: 'VISIBLE',
      },
    })
    
    console.log(`[getSubcategoryImage] Всего товаров в категориях: ${totalProducts}`)
    
    // Ищем первый товар с изображениями в этой категории
    // В Prisma для массивов нужно использовать NOT isEmpty: true вместо isEmpty: false
    const product = await prisma.product.findFirst({
      where: {
        categoryId: {
          in: allCategoryIds,
        },
        isActive: true,
        visibility: 'VISIBLE',
        NOT: {
          images: {
            isEmpty: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        images: true,
        categoryId: true,
      },
      orderBy: {
        createdAt: 'desc', // Берем самый новый товар
      },
    })
    
    if (product) {
      console.log(`[getSubcategoryImage] Найден товар "${product.name}" (ID: ${product.id}, categoryId: ${product.categoryId}) с изображениями:`, product.images)
      
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Возвращаем первое изображение товара
        const firstImage = product.images[0]
        if (typeof firstImage === 'string' && firstImage.trim() !== '') {
          console.log(`[getSubcategoryImage] ✅ Найдено изображение для категории ${categoryId} из товара "${product.name}":`, firstImage)
          return firstImage
        } else {
          console.warn(`[getSubcategoryImage] Первое изображение товара "${product.name}" не является валидной строкой:`, firstImage, 'type:', typeof firstImage)
        }
      } else {
        console.warn(`[getSubcategoryImage] Товар "${product.name}" найден, но массив images пустой или не является массивом:`, product.images)
      }
    } else {
      console.warn(`[getSubcategoryImage] ⚠️ Не найдено товаров с изображениями для категории ${categoryId} (проверено категорий: ${allCategoryIds.length}, всего товаров: ${totalProducts})`)
    }
    
    return null
  } catch (error) {
    console.error(`[getSubcategoryImage] Ошибка при получении изображения для категории ${categoryId}:`, error)
    return null
  }
}











