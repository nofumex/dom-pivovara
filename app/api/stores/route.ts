import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { serializeObject } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    // Сериализуем Decimal поля перед отправкой
    const serializedStores = serializeObject(stores)
    return successResponse(serializedStores)
  } catch (error) {
    console.error('Stores GET error:', error)
    return errorResponse('Ошибка при получении магазинов', 500)
  }
}

