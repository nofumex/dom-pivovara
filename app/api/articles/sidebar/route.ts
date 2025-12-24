import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(_request: NextRequest) {
  try {
    const articles = await prisma.article.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 3,
      select: {
        slug: true,
        title: true,
        image: true,
      },
    })

    return successResponse(articles)
  } catch (error) {
    console.error('Articles sidebar GET error:', error)
    return errorResponse('Ошибка при получении статей', 500)
  }
}







