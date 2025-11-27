import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getAuthUserWithRefresh } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { CustomerDetails } from '@/components/admin/CustomerDetails/CustomerDetails'

export default async function AdminCustomerPage({
  params,
}: {
  params: { id: string }
}) {
  const { user } = await getAuthUserWithRefresh()

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
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

