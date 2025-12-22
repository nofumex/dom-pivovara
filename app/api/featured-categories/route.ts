import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    // Проверяем, существует ли модель в Prisma клиенте
    if (!prisma.featuredCategoryTile) {
      console.error('FeaturedCategoryTile model not found in Prisma client. Please run: npx prisma generate')
      return successResponse([])
    }

    const tiles = await prisma.featuredCategoryTile.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return successResponse(tiles)
  } catch (error: any) {
    console.error('Featured categories API error:', error)
    // Если ошибка связана с отсутствием модели, возвращаем пустой массив
    if (error.message?.includes('featuredCategoryTile') || error.message?.includes('Cannot read properties')) {
      console.error('Prisma client may need regeneration. Run: npx prisma generate')
      return successResponse([])
    }
    return errorResponse('Ошибка при получении категорий', 500)
  }
}


















