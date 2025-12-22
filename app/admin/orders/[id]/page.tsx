import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getAuthUserWithRefresh } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { OrderDetails } from '@/components/admin/OrderDetails/OrderDetails'

export default async function AdminOrderPage({
  params,
}: {
  params: { id: string }
}) {
  const { user } = await getAuthUserWithRefresh()

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      User: true,
      OrderItem: {
        include: {
          Product: {
            select: {
              title: true,
              slug: true,
              images: true,
            },
          },
        },
      },
      Address: true,
      OrderLog: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!order) {
    notFound()
  }

  return <OrderDetails order={order} />
}

