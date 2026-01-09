import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { paginatedResponse, errorResponse } from '@/lib/response'
import { ProductVisibility, StockStatus } from '@prisma/client'

// Кешируем на 60 секунд для улучшения производительности
export const revalidate = 60

// Рекурсивная функция для получения всех дочерних категорий
async function getAllChildCategoryIds(categoryId: string): Promise<string[]> {
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    // Filters
    const category = searchParams.get('category')
    const subcategory = searchParams.get('subcategory')
    const priceMin = searchParams.get('priceMin')
    const priceMax = searchParams.get('priceMax')
    const inStock = searchParams.get('inStock')
    const stockStatus = searchParams.get('stockStatus') as StockStatus | null
    const search = searchParams.get('search')
    const tags = searchParams.getAll('tags')
    const badges = searchParams.getAll('badges') // For backward compatibility
    const ids = searchParams.getAll('id[]')

    // Sort
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    // Для публичного API скрываем товары с остатком 0
    const where: any = {
      visibility: ProductVisibility.VISIBLE,
      isActive: true,
      stock: { gt: 0 }, // Показываем только товары с остатком больше 0
    }

    if (category) {
      // Находим категорию по slug
      const categoryRecord = await prisma.category.findUnique({
        where: { slug: category },
        select: { id: true },
      })

      if (categoryRecord) {
        // Получаем все ID категорий (сама категория + все дочерние)
        const allCategoryIds = await getAllChildCategoryIds(categoryRecord.id)
        
        where.categoryId = {
          in: allCategoryIds,
        }
      } else {
        // Если категория не найдена, возвращаем пустой результат
        where.categoryId = {
          in: [],
        }
      }
    }

    if (subcategory) {
      where.Category = {
        OR: [
          { slug: subcategory },
          { other_Category: { some: { slug: subcategory } } },
        ],
      }
    }

    if (priceMin || priceMax) {
      where.price = {}
      if (priceMin) {
        where.price.gte = parseFloat(priceMin)
      }
      if (priceMax) {
        where.price.lte = parseFloat(priceMax)
      }
    }

    if (inStock === 'true') {
      where.isInStock = true
      // stock > 0 уже установлен выше, но убедимся
      where.stock = { gt: 0 }
    } else if (inStock === 'false') {
      // Если явно запрошены товары не в наличии, убираем фильтр по stock
      where.isInStock = false
      delete where.stock
    }

    if (stockStatus) {
      where.stockStatus = stockStatus
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter by badges (ProductBadge enum)
    const allBadges = badges.length > 0 ? badges : tags
    if (allBadges.length > 0) {
      where.badges = { hasSome: allBadges }
    }
    
    // Also filter by tags if provided separately
    if (tags.length > 0 && badges.length === 0) {
      where.tags = { hasSome: tags }
    }

    if (ids.length > 0) {
      where.id = { in: ids }
    }

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'price') {
      orderBy.price = sortOrder
    } else if (sortBy === 'name' || sortBy === 'title') {
      orderBy.title = sortOrder
    } else if (sortBy === 'rating') {
      orderBy.rating = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    // Get products and count
    // Используем select вместо include для оптимизации - не загружаем description и content
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          sku: true,
          title: true,
          slug: true,
          price: true,
          oldPrice: true,
          stock: true,
          isInStock: true,
          images: true,
          badges: true,
          tags: true,
          rating: true,
          createdAt: true,
          Category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          // НЕ загружаем description и content для списка товаров
        },
      }),
      prisma.product.count({ where }),
    ])

    // Transform products for response
    const transformedProducts = products.map((product) => ({
      ...product,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      rating: product.rating ? Number(product.rating) : 0,
      badges: product.badges || [],
      tags: product.tags || [],
      // Единая логика статуса наличия, как в карточке товара и сравнении
      stockStatus: product.isInStock
        ? product.stock > 10
          ? 'MANY'
          : product.stock > 0
            ? 'ENOUGH'
            : 'FEW'
        : 'NONE',
    }))

    return paginatedResponse(transformedProducts, page, limit, total)
  } catch (error) {
    console.error('Products API error:', error)
    return errorResponse('Ошибка при получении товаров', 500)
  }
}

