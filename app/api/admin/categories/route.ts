import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { createCategorySchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const categories = await prisma.category.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        parent: true,
        children: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    return successResponse(categories)
  } catch (error) {
    console.error('Admin categories GET error:', error)
    return errorResponse('Ошибка при получении категорий', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN, UserRole.MANAGER])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = createCategorySchema.parse(body)

    // Check if slug exists
    const existingSlug = await prisma.category.findUnique({
      where: { slug: validated.slug },
    })
    if (existingSlug) {
      return errorResponse('Категория с таким slug уже существует', 409)
    }

    const category = await prisma.category.create({
      data: validated,
      include: {
        parent: true,
        children: true,
      },
    })

    return successResponse(category, 'Категория создана успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin categories POST error:', error)
    return errorResponse('Ошибка при создании категории', 500)
  }
}

