import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { createAddressSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; addressId: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.id !== params.id) {
      return errorResponse('Не авторизован', 401)
    }

    const address = await prisma.address.findUnique({
      where: { id: params.addressId },
    })

    if (!address || address.userId !== params.id) {
      return errorResponse('Адрес не найден', 404)
    }

    const body = await request.json()
    const validated = createAddressSchema.partial().parse(body)

    // If this is main address, unset other main addresses
    if (validated.isMain) {
      await prisma.address.updateMany({
        where: { userId: params.id, isMain: true, id: { not: params.addressId } },
        data: { isMain: false },
      })
    }

    const updated = await prisma.address.update({
      where: { id: params.addressId },
      data: validated,
    })

    return successResponse(updated, 'Адрес обновлен успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('User address PUT error:', error)
    return errorResponse('Ошибка при обновлении адреса', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; addressId: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.id !== params.id) {
      return errorResponse('Не авторизован', 401)
    }

    const address = await prisma.address.findUnique({
      where: { id: params.addressId },
    })

    if (!address || address.userId !== params.id) {
      return errorResponse('Адрес не найден', 404)
    }

    await prisma.address.delete({
      where: { id: params.addressId },
    })

    return successResponse(null, 'Адрес удален успешно')
  } catch (error) {
    console.error('User address DELETE error:', error)
    return errorResponse('Ошибка при удалении адреса', 500)
  }
}








