import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'

const articleUpdateSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  date: z.string().optional(),
  preview: z.string().optional(),
  image: z.string().optional(),
  content: z.string().optional(),
  layout: z.enum(['TOP_FULL', 'LEFT_SQUARE', 'RIGHT_SQUARE']).optional(),
  isPublished: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const existing = await prisma.article.findUnique({
      where: { slug: params.slug },
    })

    if (!existing) {
      return errorResponse('Статья не найдена', 404)
    }

    const body = await request.json()
    const validated = articleUpdateSchema.parse(body)

    const data: any = { ...validated }
    if (validated.date) {
      data.date = new Date(validated.date)
    }

    const updated = await prisma.article.update({
      where: { slug: params.slug },
      data,
    })

    return successResponse(updated, 'Статья обновлена успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin article PUT error:', error)
    return errorResponse('Ошибка при обновлении статьи', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const existing = await prisma.article.findUnique({
      where: { slug: params.slug },
    })

    if (!existing) {
      return errorResponse('Статья не найдена', 404)
    }

    await prisma.article.delete({
      where: { slug: params.slug },
    })

    return successResponse(null, 'Статья удалена успешно')
  } catch (error) {
    console.error('Admin article DELETE error:', error)
    return errorResponse('Ошибка при удалении статьи', 500)
  }
}







