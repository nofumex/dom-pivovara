import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole, Prisma } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { createCategorySchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const categories = await prisma.category.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        Category: true,
        other_Category: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        _count: {
          select: {
            Product: true,
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
    const user = await verifyRole(request, [UserRole.ADMIN])
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
      data: {
        id: randomUUID(),
        name: validated.name,
        slug: validated.slug,
        description: validated.description ?? undefined,
        image: validated.image ?? undefined,
        isActive: validated.isActive,
        sortOrder: validated.sortOrder,
        seoTitle: validated.seoTitle ?? undefined,
        seoDesc: validated.seoDesc ?? undefined,
        updatedAt: new Date(),
        ...(validated.parentId && { parentId: validated.parentId }),
      },
      include: {
        Category: true,
        other_Category: true,
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


















