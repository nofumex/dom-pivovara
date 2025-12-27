import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'

const promotionPageSchema = z.object({
  slug: z.string().min(1, 'Slug обязателен').optional(),
  title: z.string().min(1, 'Заголовок обязателен').optional(),
  content: z.string().min(1, 'Содержимое обязательно').optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const page = await prisma.promotionPage.findUnique({
      where: { slug: params.slug },
    })

    if (!page) {
      return errorResponse('Страница не найдена', 404)
    }

    return successResponse(page)
  } catch (error) {
    console.error('Promotion page GET error:', error)
    return errorResponse('Ошибка при получении промо-страницы', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const page = await prisma.promotionPage.findUnique({
      where: { slug: params.slug },
    })

    if (!page) {
      return errorResponse('Страница не найдена', 404)
    }

    const body = await request.json()
    const validated = promotionPageSchema.parse(body)

    const updated = await prisma.promotionPage.update({
      where: { slug: params.slug },
      data: validated,
    })

    return successResponse(updated, 'Промо-страница обновлена успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin promotion page PUT error:', error)
    return errorResponse('Ошибка при обновлении промо-страницы', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const page = await prisma.promotionPage.findUnique({
      where: { slug: params.slug },
    })

    if (!page) {
      return errorResponse('Страница не найдена', 404)
    }

    await prisma.promotionPage.delete({
      where: { slug: params.slug },
    })

    return successResponse(null, 'Промо-страница удалена успешно')
  } catch (error) {
    console.error('Admin promotion page DELETE error:', error)
    return errorResponse('Ошибка при удалении промо-страницы', 500)
  }
}
















