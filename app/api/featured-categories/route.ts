import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const tiles = await prisma.featuredCategoryTile.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return successResponse(tiles)
  } catch (error) {
    console.error('Featured categories API error:', error)
    return errorResponse('Ошибка при получении категорий', 500)
  }
}





