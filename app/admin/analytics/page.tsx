import { prisma } from '@/lib/db'
import { getAuthUserWithRefresh } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard/AnalyticsDashboard'

export default async function AdminAnalyticsPage() {
  const { user } = await getAuthUserWithRefresh()

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Get analytics data
  const [
    totalUsers,
    totalOrders,
    totalRevenue,
    totalProducts,
    newUsers,
    newOrders,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: 'CANCELLED' } },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    }),
  ])

  // Get order stats by status
  const orderStatsByStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  })

  // Get orders by date (last 30 days)
  const ordersByDate = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      createdAt: true,
      total: true,
      status: true,
    },
  })

  // Get product details for top products
  const topProductsWithDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
        },
      })
      return {
        ...product,
        totalSold: item._sum.quantity || 0,
      }
    })
  )

  const analytics = {
    totalUsers,
    totalOrders,
    totalRevenue: Number(totalRevenue._sum.total || 0),
    totalProducts,
    newUsers,
    newOrders,
    recentOrders,
    topProducts: topProductsWithDetails.filter((p): p is NonNullable<typeof p> => p !== null),
    orderStatsByStatus: orderStatsByStatus.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id
      return acc
    }, {} as Record<string, number>),
    ordersByDate: ordersByDate.map((order) => ({
      date: order.createdAt.toISOString().split('T')[0],
      total: Number(order.total),
      status: order.status,
    })),
  }

  return <AnalyticsDashboard analytics={analytics} />
}























