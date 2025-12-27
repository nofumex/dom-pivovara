import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    const response = successResponse(articles)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error) {
    console.error('Articles sidebar GET error:', error)
    return errorResponse('Ошибка при получении статей', 500)
  }
}










