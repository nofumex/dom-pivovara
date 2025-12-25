import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole, ProductVisibility } from '@prisma/client'
import { paginatedResponse, errorResponse, successResponse } from '@/lib/response'
import { serializeObject } from '@/lib/serialize'
import { createProductSchema } from '@/lib/validations'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    // Filters
    const search = searchParams.get('search')
    const category = searchParams.get('category') // ID категории
    const visibility = searchParams.get('visibility') as ProductVisibility | null
    const isActive = searchParams.get('isActive')
    const stock = searchParams.get('stock')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}

    // В админке показываем все товары, но применяем фильтры если указаны
    if (visibility) {
      where.visibility = visibility
    }

    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

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

    // Фильтр по остатку
    if (stock) {
      switch (stock) {
        case 'in_stock':
          where.stock = { gt: 0 }
          break
        case 'out_of_stock':
          where.stock = 0
          break
        case 'low':
          where.stock = { gte: 1, lte: 10 }
          break
        case 'many':
          where.stock = { gt: 10 }
          break
      }
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

    // Transform products for response
    const transformedProducts = products.map((product) => ({
      ...product,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      rating: product.rating ? Number(product.rating) : 0,
      badges: product.badges || [],
      tags: product.tags || [],
    }))

    // Сериализуем Decimal поля перед отправкой
    const serializedProducts = serializeObject(transformedProducts)
    return paginatedResponse(serializedProducts, page, limit, total)
  } catch (error) {
    console.error('Admin products GET error:', error)
    return errorResponse('Ошибка при получении товаров', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const { variants, ...productBody } = body
    const validated = createProductSchema.parse(productBody)

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({
      where: { sku: validated.sku },
    })
    if (existingSku) {
      return errorResponse('Товар с таким SKU уже существует', 409)
    }

    // Check slug uniqueness
    const existingSlug = await prisma.product.findUnique({
      where: { slug: validated.slug },
    })
    if (existingSlug) {
      return errorResponse('Товар с таким slug уже существует', 409)
    }

    const { category, ...rest } = validated
    const productData: any = {
      id: randomUUID(),
      ...rest,
      price: validated.price.toString(),
      oldPrice: validated.oldPrice?.toString(),
      weight: validated.weight?.toString(),
    }

    // Create product with variants
    const product = await prisma.product.create({
      data: {
        ...productData,
        ProductVariant: variants && Array.isArray(variants) && variants.length > 0 ? {
          create: variants.map((variant: any) => ({
            id: randomUUID(),
            size: variant.size,
            color: variant.color,
            material: variant.material,
            price: (variant.price || validated.price).toString(),
            stock: variant.stock || 0,
            sku: variant.sku || `${validated.sku}-${randomUUID().substring(0, 8)}`,
            imageUrl: variant.imageUrl,
            isActive: variant.isActive !== undefined ? variant.isActive : true,
          })),
        } : undefined,
      },
      include: {
        Category: true,
        ProductVariant: true,
      },
    })

    // Сериализуем Decimal поля перед отправкой
    const serializedProduct = serializeObject(product)
    return successResponse(serializedProduct, 'Товар создан успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin product POST error:', error)
    return errorResponse('Ошибка при создании товара', 500)
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

    // Проверяем, какие товары используются в заказах
    const productsInOrders = await prisma.orderItem.findMany({
      where: {
        productId: {
          in: ids,
        },
      },
      select: {
        productId: true,
      },
      distinct: ['productId'],
    })

    const productsInOrdersIds = new Set(
      productsInOrders.map((item) => item.productId)
    )

    // Разделяем товары на те, которые можно удалить и которые нельзя
    const deletableIds = ids.filter((id: string) => !productsInOrdersIds.has(id))
    const nonDeletableIds = ids.filter((id: string) => productsInOrdersIds.has(id))

    // Проверяем существование товаров
    const existingProducts = await prisma.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
      },
    })

    const existingIds = existingProducts.map((p) => p.id)
    const notFoundIds = ids.filter((id: string) => !existingIds.includes(id))
    const deletableExistingIds = deletableIds.filter((id: string) => existingIds.includes(id))

    // Удаляем только те товары, которые не используются в заказах и существуют
    let deletedCount = 0
    if (deletableExistingIds.length > 0) {
      // Сначала удаляем варианты товаров
      await prisma.productVariant.deleteMany({
        where: {
          productId: {
            in: deletableExistingIds,
          },
        },
      })

      // Затем удаляем товары
      await prisma.product.deleteMany({
        where: {
          id: {
            in: deletableExistingIds,
          },
        },
      })
      deletedCount = deletableExistingIds.length
    }

    const result = {
      deleted: deletedCount,
      cannotDelete: nonDeletableIds.length,
      notFound: notFoundIds.length,
      cannotDeleteIds: nonDeletableIds,
      notFoundIds: notFoundIds,
    }

    return successResponse(result, `Удалено товаров: ${deletedCount}`)
  } catch (error) {
    console.error('Admin products DELETE error:', error)
    return errorResponse('Ошибка при удалении товаров', 500)
  }
}
