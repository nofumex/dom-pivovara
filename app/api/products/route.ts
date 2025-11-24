import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { paginatedResponse, errorResponse } from '@/lib/response'
import { ProductVisibility, StockStatus } from '@prisma/client'

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
    const where: any = {
      visibility: ProductVisibility.VISIBLE,
      isActive: true,
    }

    if (category) {
      where.categoryObj = {
        slug: category,
      }
    }

    if (subcategory) {
      where.categoryObj = {
        OR: [
          { slug: subcategory },
          { children: { some: { slug: subcategory } } },
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
      where.stock = { gt: 0 }
    } else if (inStock === 'false') {
      where.isInStock = false
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

    const allTags = tags.length > 0 ? tags : badges
    if (allTags.length > 0) {
      where.tags = { hasSome: allTags }
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
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          categoryObj: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    return paginatedResponse(products, page, limit, total)
  } catch (error) {
    console.error('Products API error:', error)
    return errorResponse('Ошибка при получении товаров', 500)
  }
}

