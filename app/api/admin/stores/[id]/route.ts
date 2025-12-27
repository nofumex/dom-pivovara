import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { serializeObject } from '@/lib/serialize'
import { z } from 'zod'

const updateStoreSchema = z.object({
  address: z.string().min(1, 'Адрес обязателен').optional(),
  mapUrl: z.string().url('Некорректный URL карты').optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const store = await prisma.store.findUnique({
      where: { id: params.id },
    })

    if (!store) {
      return errorResponse('Магазин не найден', 404)
    }

    // Сериализуем Decimal поля перед отправкой
    const serializedStore = serializeObject(store)
    return successResponse(serializedStore)
  } catch (error) {
    console.error('Admin store GET error:', error)
    return errorResponse('Ошибка при получении магазина', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = updateStoreSchema.parse(body)

    const existingStore = await prisma.store.findUnique({
      where: { id: params.id },
    })

    if (!existingStore) {
      return errorResponse('Магазин не найден', 404)
    }

    const updateData: any = {}
    if (validated.address !== undefined) updateData.address = validated.address
    if (validated.mapUrl !== undefined) updateData.mapUrl = validated.mapUrl
    if (validated.order !== undefined) updateData.order = validated.order
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive

    const updated = await prisma.store.update({
      where: { id: params.id },
      data: updateData,
    })

    // Сериализуем Decimal поля перед отправкой
    const serializedStore = serializeObject(updated)
    return successResponse(serializedStore, 'Магазин обновлен успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin store PUT error:', error)
    return errorResponse('Ошибка при обновлении магазина', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const store = await prisma.store.findUnique({
      where: { id: params.id },
    })

    if (!store) {
      return errorResponse('Магазин не найден', 404)
    }

    await prisma.store.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'Магазин удален успешно')
  } catch (error) {
    console.error('Admin store DELETE error:', error)
    return errorResponse('Ошибка при удалении магазина', 500)
  }
}

