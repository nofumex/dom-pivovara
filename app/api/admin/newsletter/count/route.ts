import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUserWithRefresh } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthUserWithRefresh()

    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Доступ запрещен', 403)
    }

    const count = await prisma.emailSubscription.count({
      where: { isActive: true },
    })

    return successResponse({ count }, 'Количество подписчиков получено')
  } catch (error: any) {
    console.error('Error fetching subscribers count:', error)
    return errorResponse('Ошибка при получении количества подписчиков', 500)
  }
}














