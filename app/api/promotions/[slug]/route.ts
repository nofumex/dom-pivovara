import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const page = await prisma.promotionPage.findUnique({
      where: {
        slug: params.slug,
        isActive: true,
      },
    })

    if (!page) {
      return errorResponse('Страница не найдена', 404)
    }

    return successResponse(page)
  } catch (error) {
    console.error('Promotion page GET error:', error)
    return errorResponse('Ошибка при получении промо-страницы', 500)
  }
}













