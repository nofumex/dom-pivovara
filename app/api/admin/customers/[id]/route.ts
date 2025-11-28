import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN, UserRole.VIEWER])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const customer = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        addresses: true,
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!customer) {
      return errorResponse('Клиент не найден', 404)
    }

    return successResponse(customer)
  } catch (error) {
    console.error('Admin customer GET error:', error)
    return errorResponse('Ошибка при получении клиента', 500)
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
    const { role, isBlocked } = body

    const customer = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!customer) {
      return errorResponse('Клиент не найден', 404)
    }

    const updateData: any = {}
    if (role) updateData.role = role
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isBlocked: true,
      },
    })

    return successResponse(updated, 'Клиент обновлен успешно')
  } catch (error) {
    console.error('Admin customer PUT error:', error)
    return errorResponse('Ошибка при обновлении клиента', 500)
  }
}




