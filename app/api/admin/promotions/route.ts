import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'

const promotionPageSchema = z.object({
  slug: z.string().min(1, 'Slug обязателен'),
  title: z.string().min(1, 'Заголовок обязателен'),
  content: z.string().min(1, 'Содержимое обязательно'),
  isActive: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const pages = await prisma.promotionPage.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(pages)
  } catch (error) {
    console.error('Admin promotions GET error:', error)
    return errorResponse('Ошибка при получении промо-страниц', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = promotionPageSchema.parse(body)

    const page = await prisma.promotionPage.create({
      data: validated,
    })

    return successResponse(page, 'Промо-страница создана успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin promotions POST error:', error)
    return errorResponse('Ошибка при создании промо-страницы', 500)
  }
}
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'

const promotionPageSchema = z.object({
  slug: z.string().min(1, 'Slug обязателен'),
  title: z.string().min(1, 'Заголовок обязателен'),
  content: z.string().min(1, 'Содержимое обязательно'),
  isActive: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const pages = await prisma.promotionPage.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(pages)
  } catch (error) {
    console.error('Admin promotions GET error:', error)
    return errorResponse('Ошибка при получении промо-страниц', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = promotionPageSchema.parse(body)

    const page = await prisma.promotionPage.create({
      data: validated,
    })

    return successResponse(page, 'Промо-страница создана успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin promotions POST error:', error)
    return errorResponse('Ошибка при создании промо-страницы', 500)
  }
}
