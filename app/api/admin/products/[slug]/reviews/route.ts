import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        Review: {
          include: {
            User: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    return successResponse(product.Review)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return errorResponse('Ошибка при получении отзывов', 500)
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

    const body = await request.json()
    const { reviewId, isActive } = body

    if (!reviewId || typeof isActive !== 'boolean') {
      return errorResponse('Неверные параметры', 400)
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { isActive },
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

    // Пересчитываем рейтинг товара
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        Review: {
          where: { isActive: true },
        },
      },
    })

    if (product) {
      const activeReviews = product.Review
      const avgRating =
        activeReviews.length > 0
          ? activeReviews.reduce((sum, r) => sum + r.rating, 0) / activeReviews.length
          : 0

      await prisma.product.update({
        where: { id: product.id },
        data: {
          rating: avgRating,
          ratingCount: activeReviews.length,
        },
      })
    }

    return successResponse(review)
  } catch (error) {
    console.error('Error updating review:', error)
    return errorResponse('Ошибка при обновлении отзыва', 500)
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

    const body = await request.json()
    const { reviewId } = body

    if (!reviewId) {
      return errorResponse('Не указан ID отзыва', 400)
    }

    // Проверяем, что отзыв принадлежит товару
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        Review: {
          where: { id: reviewId },
        },
      },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    if (product.Review.length === 0) {
      return errorResponse('Отзыв не найден', 404)
    }

    // Удаляем отзыв
    await prisma.review.delete({
      where: { id: reviewId },
    })

    // Пересчитываем рейтинг товара
    const updatedProduct = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        Review: {
          where: { isActive: true },
        },
      },
    })

    if (updatedProduct) {
      const activeReviews = updatedProduct.Review
      const avgRating =
        activeReviews.length > 0
          ? activeReviews.reduce((sum, r) => sum + r.rating, 0) / activeReviews.length
          : 0

      await prisma.product.update({
        where: { id: updatedProduct.id },
        data: {
          rating: avgRating,
          ratingCount: activeReviews.length,
        },
      })
    }

    return successResponse(null, 'Отзыв удален успешно')
  } catch (error) {
    console.error('Error deleting review:', error)
    return errorResponse('Ошибка при удалении отзыва', 500)
  }
}

