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
        ...productData,
        price: validated.price.toString(),
        oldPrice: validated.oldPrice?.toString(),
        weight: validated.weight?.toString(),
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


