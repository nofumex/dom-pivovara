import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { paginatedResponse, errorResponse } from '@/lib/response'
import { serializeObject } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          User: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          OrderItem: {
            include: {
              Product: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  images: true,
                },
              },
            },
          },
          Address: true,
        },
      }),
      prisma.order.count({ where }),
    ])

    // Сериализуем Decimal поля перед отправкой
    const serializedOrders = serializeObject(orders)
    return paginatedResponse(serializedOrders, page, limit, total)
  } catch (error) {
    console.error('Admin orders GET error:', error)
    return errorResponse('Ошибка при получении заказов', 500)
  }
}




