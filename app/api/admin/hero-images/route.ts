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

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const images = await prisma.heroImage.findMany({
      orderBy: { order: 'asc' },
    })

    return successResponse(images)
  } catch (error) {
    console.error('Admin hero images GET error:', error)
    return errorResponse('Ошибка при получении изображений', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = heroImageSchema.parse(body)

    const image = await prisma.heroImage.create({
      data: validated,
    })

    return successResponse(image, 'Изображение создано успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin hero images POST error:', error)
    return errorResponse('Ошибка при создании изображения', 500)
  }
}








