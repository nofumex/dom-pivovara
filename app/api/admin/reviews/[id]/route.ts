import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const parsed = updateReviewSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Ошибка валидации', 400, parsed.error.errors[0]?.message)
    }

    const review = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Product: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    })

    return successResponse(review, 'Отзыв обновлен')
  } catch (error) {
    console.error('Admin review PATCH error:', error)
    return errorResponse('Ошибка при обновлении отзыва', 500)
  }
}














