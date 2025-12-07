import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getAuthUserWithRefresh } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { LeadDetails } from '@/components/admin/LeadDetails/LeadDetails'

export default async function AdminLeadPage({
  params,
}: {
  params: { id: string }
}) {
  const { user } = await getAuthUserWithRefresh()

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
  })

  if (!lead) {
    notFound()
  }

  return <LeadDetails lead={lead} />
}
