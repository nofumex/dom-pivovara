import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { paginatedResponse, errorResponse } from '@/lib/response'
import { createProductSchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER])
    if (!user) {
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
    console.error('Admin products GET error:', error)
    return errorResponse('Ошибка при получении товаров', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN, UserRole.MANAGER])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = createProductSchema.parse(body)

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
        ...validated,
        price: validated.price.toString(),
        oldPrice: validated.oldPrice?.toString(),
        weight: validated.weight?.toString(),
      },
      include: {
        categoryObj: true,
      },
    })

    return successResponse(product, 'Товар создан успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin products POST error:', error)
    return errorResponse('Ошибка при создании товара', 500)
  }
}

