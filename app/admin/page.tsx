import { prisma } from '@/lib/db'
import { DashboardStats } from '@/components/admin/DashboardStats/DashboardStats'
import { RecentOrders } from '@/components/admin/RecentOrders/RecentOrders'
import { TopProducts } from '@/components/admin/TopProducts/TopProducts'
import styles from './page.module.scss'

export default async function AdminDashboard() {
  // Авторизация уже проверена в layout

  const [
    totalUsers,
    totalOrders,
    totalProducts,
    totalRevenue,
    recentOrders,
    newUsersToday,
    newOrdersToday,
    topProducts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: 'CANCELLED' } },
    }),
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
        items: {
          take: 3,
          include: {
            product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
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
      take: 5,
    }),
  ])

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
          images: true,
        },
      })
      return {
        ...product,
        totalSold: item._sum.quantity || 0,
      }
    })
  )

  const stats = {
    totalUsers,
    totalOrders,
    totalProducts,
    totalRevenue: Number(totalRevenue._sum.total || 0),
    newUsersToday,
    newOrdersToday,
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.title}>Панель управления</h1>
        <p className={styles.subtitle}>Обзор статистики и активности</p>
      </div>

      <DashboardStats stats={stats} />

      <div className={styles.dashboardGrid}>
        <div className={styles.gridColumn}>
          <RecentOrders orders={recentOrders} />
        </div>
        <div className={styles.gridColumn}>
          <TopProducts products={topProductsWithDetails} />
        </div>
      </div>
    </div>
  )
}
