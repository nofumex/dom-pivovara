import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { verifyAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { CustomerDetails } from '@/components/admin/CustomerDetails/CustomerDetails'

export default async function AdminCustomerPage({
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
    const user = await verifyAuth({ cookies: () => cookieStore } as any)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      redirect('/admin/login')
    }
  } catch {
    redirect('/admin/login')
  }

  const customer = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      addresses: true,
    },
  })

  if (!customer) {
    notFound()
  }

  return <CustomerDetails customer={customer} />
}

