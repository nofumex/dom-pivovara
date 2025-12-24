import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { createCategorySchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Category API: Starting request for ID:', params.id)
    const user = await verifyRole(request, [UserRole.ADMIN])
    console.log('Category API: User verified:', user ? 'yes' : 'no')
    if (!user) {
      console.error('Category API: Unauthorized')
      return errorResponse('Не авторизован', 401)
    }

    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        Category: true,
        other_Category: true,
        _count: {
          select: {
            Product: true,
          },
        },
      },
    })

    if (!category) {
      console.error('Category API: Category not found')
      return errorResponse('Категория не найдена', 404)
    }

    console.log('Category API: Category found:', category.name)
    return successResponse(category)
  } catch (error) {
    console.error('Admin category GET error:', error)
    return errorResponse('Ошибка при получении категории', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = createCategorySchema.partial().parse(body)

    const category = await prisma.category.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return errorResponse('Категория не найдена', 404)
    }

    // Check slug uniqueness if changed
    if (validated.slug && validated.slug !== category.slug) {
      const existingSlug = await prisma.category.findUnique({
        where: { slug: validated.slug },
      })
      if (existingSlug) {
        return errorResponse('Категория с таким slug уже существует', 409)
      }
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: validated,
      include: {
        Category: true,
        other_Category: true,
      },
    })

    return successResponse(updated, 'Категория обновлена успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin category PUT error:', error)
    return errorResponse('Ошибка при обновлении категории', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            Product: true,
            other_Category: true,
          },
        },
      },
    })

    if (!category) {
      return errorResponse('Категория не найдена', 404)
    }

    if (category._count.Product > 0) {
      return errorResponse('Нельзя удалить категорию с товарами', 400)
    }

    if (category._count.other_Category > 0) {
      return errorResponse('Нельзя удалить категорию с подкатегориями', 400)
    }

    await prisma.category.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'Категория удалена успешно')
  } catch (error) {
    console.error('Admin category DELETE error:', error)
    return errorResponse('Ошибка при удалении категории', 500)
  }
}























