import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'

const articleSchema = z.object({
  slug: z.string().min(1, 'Slug обязателен'),
  title: z.string().min(1, 'Заголовок обязателен'),
  date: z.string().optional(),
  preview: z.string().min(1, 'Превью обязательно'),
  image: z.string().min(1, 'URL изображения обязателен'),
  content: z.string().min(1, 'Контент обязателен'),
  layout: z.enum(['TOP_FULL', 'LEFT_SQUARE', 'RIGHT_SQUARE']).default('TOP_FULL'),
  isPublished: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const articles = await prisma.article.findMany({
      orderBy: { date: 'desc' },
    })

    return successResponse(
      articles.map((a) => ({
        ...a,
        date: a.date.toISOString().slice(0, 10),
      }))
    )
  } catch (error) {
    console.error('Admin articles GET error:', error)
    return errorResponse('Ошибка при получении статей', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = articleSchema.parse(body)

    const existing = await prisma.article.findUnique({
      where: { slug: validated.slug },
    })

    if (existing) {
      return errorResponse('Статья с таким slug уже существует', 409)
    }

    const date = validated.date ? new Date(validated.date) : new Date()

    const created = await prisma.article.create({
      data: {
        slug: validated.slug,
        title: validated.title,
        date,
        preview: validated.preview,
        image: validated.image,
        content: validated.content,
        layout: validated.layout,
        isPublished: validated.isPublished,
      },
    })

    return successResponse(created, 'Статья создана успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin articles POST error:', error)
    return errorResponse('Ошибка при создании статьи', 500)
  }
}










