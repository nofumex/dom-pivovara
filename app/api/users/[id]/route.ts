import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { updateProfileSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await verifyAuth(request)
    if (!authUser || authUser.id !== params.id) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = updateProfileSchema.parse(body)

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        firstName: validated.firstName ?? undefined,
        lastName: validated.lastName ?? undefined,
        phone: validated.phone ?? undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        company: true,
      },
    })

    return successResponse(updated, 'Профиль обновлен')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('User update error:', error)
    return errorResponse('Ошибка при обновлении профиля', 500)
  }
}














