import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    const [totalUsers, totalOrders, totalProducts, recentOrders, topProducts] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.product.findMany({
        take: 10,
        orderBy: { rating: 'desc' },
        select: {
          id: true,
          title: true,
          price: true,
          rating: true,
          images: true,
        },
      }),
    ])

    // Calculate revenue
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
    })

    const totalRevenue = orders.reduce((sum, order) => {
      return sum + parseFloat(order.total.toString())
    }, 0)

    // New users in period
    const newUsers = await prisma.user.count({
      where: {
        createdAt: { gte: startDate },
      },
    })

    // New orders in period
    const newOrders = orders.length

    // Order stats by status
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    })

    const byStatus: Record<string, number> = {}
    orderStats.forEach((stat) => {
      byStatus[stat.status] = stat._count
    })

    return successResponse({
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue,
      newUsers,
      newOrders,
      recentOrders,
      topProducts,
      orderStats: {
        byStatus,
      },
    })
  } catch (error) {
    console.error('Analytics GET error:', error)
    return errorResponse('Ошибка при получении аналитики', 500)
  }
}





