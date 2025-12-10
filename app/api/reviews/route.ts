import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { createReviewSchema } from '@/lib/validations'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return errorResponse('Необходима авторизация для оставления отзыва', 401)
    }

    const body = await request.json()
    const validated = createReviewSchema.parse(body)

    // Проверяем, существует ли товар
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    // Проверяем, не оставлял ли пользователь уже отзыв на этот товар
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: validated.productId,
          userId: user.id,
        },
      },
    })

    if (existingReview) {
      return errorResponse('Вы уже оставляли отзыв на этот товар', 400)
    }

    // Создаем отзыв с isActive: false (требует модерации)
    const now = new Date()
    const review = await prisma.review.create({
      data: {
        id: crypto.randomUUID(),
        productId: validated.productId,
        userId: user.id,
        rating: validated.rating,
        title: validated.title || null,
        content: validated.content,
        isActive: false, // По умолчанию отзыв не активен, требует модерации
        updatedAt: now,
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return successResponse(review, 'Отзыв отправлен на модерацию')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      // Формируем понятное сообщение об ошибке валидации
      const firstError = error.errors[0]
      let errorMessage = 'Ошибка валидации данных'
      
      if (firstError) {
        if (firstError.path.includes('content')) {
          errorMessage = 'Отзыв должен содержать минимум 10 символов. Пожалуйста, опишите ваш опыт более подробно.'
        } else if (firstError.path.includes('rating')) {
          errorMessage = 'Пожалуйста, выберите оценку от 1 до 5 звезд.'
        } else if (firstError.path.includes('productId')) {
          errorMessage = 'Не указан товар для отзыва.'
        } else {
          errorMessage = firstError.message || 'Проверьте правильность заполнения формы.'
        }
      }
      
      return errorResponse(errorMessage, 400)
    }
    if (error.code === 'P2002') {
      return errorResponse('Вы уже оставляли отзыв на этот товар. Один пользователь может оставить только один отзыв.', 400)
    }
    console.error('Error creating review:', error)
    return errorResponse('Ошибка при создании отзыва. Попробуйте позже.', 500)
  }
}

