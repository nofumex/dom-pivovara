import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'

const heroImageSchema = z.object({
  url: z.string().min(1, 'URL обязателен'),
  alt: z.string().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  title: z.string().optional(),
  text: z.string().optional(),
  buttonText: z.string().optional(),
  buttonUrl: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const image = await prisma.heroImage.findUnique({
      where: { id: params.id },
    })

    if (!image) {
      return errorResponse('Изображение не найдено', 404)
    }

    const body = await request.json()
    const validated = heroImageSchema.partial().parse(body)

    const updated = await prisma.heroImage.update({
      where: { id: params.id },
      data: validated,
    })

    return successResponse(updated, 'Изображение обновлено успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin hero image PUT error:', error)
    return errorResponse('Ошибка при обновлении изображения', 500)
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

    const image = await prisma.heroImage.findUnique({
      where: { id: params.id },
    })

    if (!image) {
      return errorResponse('Изображение не найдено', 404)
    }

    await prisma.heroImage.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'Изображение удалено успешно')
  } catch (error) {
    console.error('Admin hero image DELETE error:', error)
    return errorResponse('Ошибка при удалении изображения', 500)
  }
}























