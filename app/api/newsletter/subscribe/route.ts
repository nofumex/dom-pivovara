import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'

const subscribeSchema = z.object({
  email: z.string().email('Некорректный email'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = subscribeSchema.parse(body)

    // Проверяем, существует ли подписка
    const existing = await prisma.emailSubscription.findUnique({
      where: { email: validated.email },
    })

    if (existing) {
      if (existing.isActive) {
        return successResponse(null, 'Вы уже подписаны на рассылку')
      } else {
        // Реактивируем подписку
        await prisma.emailSubscription.update({
          where: { email: validated.email },
          data: { isActive: true },
        })
        return successResponse(null, 'Подписка возобновлена')
      }
    }

    // Создаем новую подписку
    await prisma.emailSubscription.create({
      data: {
        email: validated.email,
        isActive: true,
      },
    })

    return successResponse(null, 'Спасибо за подписку!')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Subscribe error:', error)
    return errorResponse('Ошибка при подписке', 500)
  }
}

















