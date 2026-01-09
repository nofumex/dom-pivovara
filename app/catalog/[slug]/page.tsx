import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getCategoryProductCount, getSubcategoryImage, getAllChildCategoryIds } from '@/lib/categoryUtils'
import { CategoryClient } from './CategoryClient'

// Кешируем страницу на 5 минут
export const revalidate = 300

export default async function CategoryPage({
  params,
}: {
  params: { slug: string }
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      Category: {
        select: {
          id: true,
          name: true,
          slug: true,
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

  if (!category || !category.isActive) {
    notFound()
  }

  // Оптимизация: получаем все дочерние категории одним запросом
  const subcategoryIds = category.other_Category.map(sub => sub.id)
  
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
  const subcategoriesWithoutImages = category.other_Category.filter(sub => !sub.image)
  const subcategoryIdsWithoutImages = subcategoriesWithoutImages.map(sub => sub.id)
  
  // Получаем изображения для всех подкатегорий без изображений одним запросом
  const imagesMap = new Map<string, string | null>()
  if (subcategoryIdsWithoutImages.length > 0) {
    // Получаем все дочерние ID для подкатегорий без изображений
    const allCategoryIdsForImages = Array.from(
      new Set(
        subcategoryIdsWithoutImages.flatMap(id => allChildCategoryIdsMap.get(id) || [id])
      )
    )
    
    // Находим первый товар с изображением для каждой категории
    // Получаем все товары и обрабатываем вручную, чтобы взять первое изображение для каждой категории
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
    
    // Создаем мапу categoryId -> image (берем первое изображение для каждой категории)
    const categoryImageMap = new Map<string, string>()
    for (const product of productsWithImages) {
      if (product.images && product.images.length > 0 && !categoryImageMap.has(product.categoryId)) {
        categoryImageMap.set(product.categoryId, product.images[0])
      }
    }
    
    // Для каждой подкатегории находим изображение из дочерних категорий
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
  
  // Группируем товары по категориям для подсчета
  const productCounts = await prisma.product.groupBy({
    by: ['categoryId'],
    where: {
      categoryId: { in: allCategoryIdsForCounts },
      isActive: true,
      visibility: 'VISIBLE',
    },
    _count: true,
  })
  
  // Создаем мапу categoryId -> count
  const categoryCountMap = new Map<string, number>()
  for (const item of productCounts) {
    categoryCountMap.set(item.categoryId, item._count)
  }
  
  // Для каждой подкатегории считаем товары во всех дочерних категориях
  const childrenWithCounts = category.other_Category.map((sub) => {
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

  // Преобразуем структуру данных для CategoryClient
  const categoryData = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent: category.Category,
    children: childrenWithCounts,
  }

  return <CategoryClient category={categoryData} initialProducts={[]} />
}

