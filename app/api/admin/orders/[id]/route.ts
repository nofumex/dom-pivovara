import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole, OrderStatus } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { serializeObject } from '@/lib/serialize'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN, UserRole.VIEWER])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        address: true,
        logs: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!order) {
      return errorResponse('Заказ не найден', 404)
    }

    // Сериализуем Decimal поля перед отправкой
    const serializedOrder = serializeObject(order)
    return successResponse(serializedOrder)
  } catch (error) {
    console.error('Admin order GET error:', error)
    return errorResponse('Ошибка при получении заказа', 500)
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
    const { status, trackNumber, notes } = body

    const order = await prisma.order.findUnique({
      where: { id: params.id },
    })

    if (!order) {
      return errorResponse('Заказ не найден', 404)
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (trackNumber !== undefined) updateData.trackNumber = trackNumber
    if (notes !== undefined) updateData.notes = notes

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        address: true,
        logs: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    // Create log entry
    if (status && status !== order.status) {
      await prisma.orderLog.create({
        data: {
          orderId: order.id,
          status: status as OrderStatus,
          comment: notes || `Статус изменен на ${status}`,
          createdBy: user.id,
        },
      })
    }

    // Сериализуем Decimal поля перед отправкой
    const serializedUpdated = serializeObject(updated)
    return successResponse(serializedUpdated, 'Заказ обновлен успешно')
  } catch (error) {
    console.error('Admin order PUT error:', error)
    return errorResponse('Ошибка при обновлении заказа', 500)
  }
}




