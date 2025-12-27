import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { serializeObject } from '@/lib/serialize'
import { z } from 'zod'

const storeSchema = z.object({
  address: z.string().min(1, 'Адрес обязателен'),
  mapUrl: z.string().url('Некорректный URL карты').min(1, 'URL карты обязателен'),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const stores = await prisma.store.findMany({
      orderBy: { order: 'asc' },
    })

    // Сериализуем Decimal поля перед отправкой
    const serializedStores = serializeObject(stores)
    return successResponse(serializedStores)
  } catch (error) {
    console.error('Admin stores GET error:', error)
    return errorResponse('Ошибка при получении магазинов', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = storeSchema.parse(body)

    const store = await prisma.store.create({
      data: {
        address: validated.address,
        mapUrl: validated.mapUrl,
        order: validated.order ?? 0,
        isActive: validated.isActive ?? true,
      },
    })

    // Сериализуем Decimal поля перед отправкой
    const serializedStore = serializeObject(store)
    return successResponse(serializedStore, 'Магазин создан успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin stores POST error:', error)
    return errorResponse('Ошибка при создании магазина', 500)
  }
}

