import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { paginatedResponse, errorResponse, successResponse } from '@/lib/response'
import { createProductSchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'
import { serializeObject } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  try {
    console.log('Products API: Starting request')
    const user = await verifyRole(request, [UserRole.ADMIN])
    console.log('Products API: User verified:', user ? 'yes' : 'no')
    if (!user) {
      console.error('Products API: Unauthorized')
      return errorResponse('Не авторизован', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const visibility = searchParams.get('visibility')
    const isActive = searchParams.get('isActive')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = {}

    if (category) {
      where.categoryId = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (visibility) {
      where.visibility = visibility
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const orderBy: any = {}
    if (sortBy === 'price') {
      orderBy.price = sortOrder
    } else if (sortBy === 'title') {
      orderBy.title = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    console.log('Products API: Fetching products with where:', JSON.stringify(where))
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          Category: {
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

    console.log('Products API: Found products:', products.length, 'Total:', total)
    if (products.length === 0) {
      console.log('Products API: No products found with filters:', where)
    }
    // Сериализуем Decimal поля перед отправкой
    const serializedProducts = serializeObject(products)
    console.log('Products API: Serialized products:', serializedProducts.length)
    const response = paginatedResponse(serializedProducts, page, limit, total)
    console.log('Products API: Response status will be:', response.status)
    return response
  } catch (error) {
    console.error('Admin products GET error:', error)
    return errorResponse('Ошибка при получении товаров', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse('Не указаны ID товаров для удаления', 400)
    }

    // Проверяем существование товаров
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
      },
    })

    if (products.length === 0) {
      return errorResponse('Товары не найдены', 404)
    }

    const foundIds = products.map((p) => p.id)
    const notFoundIds = ids.filter((id: string) => !foundIds.includes(id))

    // Проверяем, какие товары используются в заказах
    const productsInOrders = await prisma.orderItem.findMany({
      where: {
        productId: {
          in: foundIds,
        },
      },
      select: {
        productId: true,
      },
      distinct: ['productId'],
    })

    const productsInOrdersIds = new Set(productsInOrders.map((item) => item.productId))
    const deletableIds = foundIds.filter((id) => !productsInOrdersIds.has(id))
    const nonDeletableIds = foundIds.filter((id) => productsInOrdersIds.has(id))

    // Удаляем только те товары, которые не используются в заказах
    let deletedCount = 0
    if (deletableIds.length > 0) {
      await prisma.product.deleteMany({
        where: {
          id: {
            in: deletableIds,
          },
        },
      })
      deletedCount = deletableIds.length
    }

    const result = {
      deleted: deletedCount,
      notFound: notFoundIds.length,
      notFoundIds,
      cannotDelete: nonDeletableIds.length,
      cannotDeleteIds: nonDeletableIds,
      reason: nonDeletableIds.length > 0 
        ? 'Некоторые товары используются в заказах и не могут быть удалены'
        : undefined,
    }

    let message = `Удалено товаров: ${deletedCount}`
    if (nonDeletableIds.length > 0) {
      message += `. Не удалось удалить ${nonDeletableIds.length} товар(ов) - используются в заказах`
    }
    if (notFoundIds.length > 0) {
      message += `. Не найдено товаров: ${notFoundIds.length}`
    }

    return successResponse(result, message)
  } catch (error) {
    console.error('Admin products DELETE error:', error)
    return errorResponse('Ошибка при удалении товаров', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = createProductSchema.parse(body)
    const { category, ...productData } = validated

    // Check if SKU exists
    const existingSku = await prisma.product.findUnique({
      where: { sku: validated.sku },
    })
    if (existingSku) {
      return errorResponse('Товар с таким SKU уже существует', 409)
    }

    // Check if slug exists
    const existingSlug = await prisma.product.findUnique({
      where: { slug: validated.slug },
    })
    if (existingSlug) {
      return errorResponse('Товар с таким slug уже существует', 409)
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        id: randomUUID(),
        sku: validated.sku,
        title: validated.title,
        slug: validated.slug,
        description: productData.description ?? undefined,
        content: productData.content ?? undefined,
        price: validated.price.toString(),
        oldPrice: validated.oldPrice?.toString() ?? undefined,
        stock: validated.stock,
        stockStatus: validated.stockStatus,
        minOrder: validated.minOrder ?? 1,
        weight: validated.weight?.toString() ?? undefined,
        dimensions: productData.dimensions ?? undefined,
        material: productData.material ?? undefined,
        categoryId: validated.categoryId,
        tags: validated.tags ?? [],
        badges: validated.badges ?? [],
        images: validated.images ?? [],
        isActive: validated.isActive ?? true,
        isFeatured: validated.isFeatured ?? false,
        isInStock: validated.isInStock ?? true,
        visibility: validated.visibility ?? 'VISIBLE',
        seoTitle: validated.seoTitle ?? undefined,
        seoDesc: validated.seoDesc ?? undefined,
        metaTitle: validated.metaTitle ?? undefined,
        metaDesc: validated.metaDesc ?? undefined,
        updatedAt: new Date(),
      },
      include: {
        Category: true,
      },
    })

    // Сериализуем Decimal поля перед отправкой
    const serializedProduct = serializeObject(product)
    return successResponse(serializedProduct, 'Товар создан успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin products POST error:', error)
    return errorResponse('Ошибка при создании товара', 500)
  }
}


