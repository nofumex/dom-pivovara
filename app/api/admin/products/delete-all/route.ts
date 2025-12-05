import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    // Получаем общее количество товаров
    const totalProducts = await prisma.product.count()

    if (totalProducts === 0) {
      return successResponse(
        { deleted: 0, cannotDelete: 0 },
        'Товары не найдены'
      )
    }

    // Проверяем, какие товары используются в заказах
    const productsInOrders = await prisma.orderItem.findMany({
      select: {
        productId: true,
      },
      distinct: ['productId'],
    })

    const productsInOrdersIds = new Set(
      productsInOrders.map((item) => item.productId)
    )

    // Получаем все ID товаров
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
      },
    })

    const allProductIds = allProducts.map((p) => p.id)
    const deletableIds = allProductIds.filter(
      (id) => !productsInOrdersIds.has(id)
    )
    const nonDeletableIds = allProductIds.filter((id) =>
      productsInOrdersIds.has(id)
    )

    // Удаляем только те товары, которые не используются в заказах
    let deletedCount = 0
    if (deletableIds.length > 0) {
      // Сначала удаляем варианты товаров
      await prisma.productVariant.deleteMany({
        where: {
          productId: {
            in: deletableIds,
          },
        },
      })

      // Затем удаляем товары
      await prisma.product.deleteMany({
        where: {
          id: {
            in: deletableIds,
          },
        },
      })
      deletedCount = deletableIds.length
    }

    const result = {
      deleted: deletedCount,
      cannotDelete: nonDeletableIds.length,
      cannotDeleteIds: nonDeletableIds,
      total: totalProducts,
      reason:
        nonDeletableIds.length > 0
          ? 'Некоторые товары используются в заказах и не могут быть удалены'
          : undefined,
    }

    let message = `Удалено товаров: ${deletedCount} из ${totalProducts}`
    if (nonDeletableIds.length > 0) {
      message += `. Не удалось удалить ${nonDeletableIds.length} товар(ов) - используются в заказах`
    }

    return successResponse(result, message)
  } catch (error) {
    console.error('Admin products delete-all error:', error)
    return errorResponse('Ошибка при удалении всех товаров', 500)
  }
}

