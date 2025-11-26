import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getAuthUserFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { OrderDetails } from '@/components/admin/OrderDetails/OrderDetails'

export default async function AdminOrderPage({
  params,
}: {
  params: { id: string }
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  if (!token) {
    redirect('/admin/login')
  }

  try {
    const user = await getAuthUserFromCookies(token)
    if (!user || user.role !== 'ADMIN') {
      redirect('/admin/login')
    }
  } catch {
    redirect('/admin/login')
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      items: {
        include: {
          product: {
            select: {
              title: true,
              slug: true,
              images: true,
            },
          },
        },
      },
      address: true,
      logs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!order) {
    notFound()
  }

  return <OrderDetails order={order} />
}

