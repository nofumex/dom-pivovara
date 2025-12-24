import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response'
import { createAddressSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.id !== params.id) {
      return errorResponse('Не авторизован', 401)
    }

    const addresses = await prisma.address.findMany({
      where: { userId: params.id },
      orderBy: { isMain: 'desc' },
    })

    return successResponse(addresses)
  } catch (error) {
    console.error('User addresses GET error:', error)
    return errorResponse('Ошибка при получении адресов', 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.id !== params.id) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = createAddressSchema.parse(body)

    // If this is main address, unset other main addresses
    if (validated.isMain) {
      await prisma.address.updateMany({
        where: { userId: params.id, isMain: true },
        data: { isMain: false },
      })
    }

    const address = await prisma.address.create({
      data: {
        id: randomUUID(),
        userId: params.id,
        name: validated.name,
        street: validated.street,
        city: validated.city,
        region: validated.region,
        zipCode: validated.zipCode,
        phone: validated.phone ?? undefined,
        isMain: validated.isMain ?? false,
      },
    })

    return successResponse(address, 'Адрес создан успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('User address POST error:', error)
    return errorResponse('Ошибка при создании адреса', 500)
  }
}






















