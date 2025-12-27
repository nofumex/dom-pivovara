import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUserWithRefresh } from '@/lib/auth-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getAuthUserWithRefresh()

    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Доступ запрещен', 403)
    }

    const body = await request.json()
    const { status } = body

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        status: status,
      },
    })

    return successResponse(lead, 'Заявка обновлена')
  } catch (error: any) {
    console.error('Error updating lead:', error)
    return errorResponse('Ошибка при обновлении заявки', 500)
  }
}

















