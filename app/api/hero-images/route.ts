import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const images = await prisma.heroImage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    })

    return successResponse(images)
  } catch (error) {
    console.error('Hero images API error:', error)
    return errorResponse('Ошибка при получении изображений', 500)
  }
}




