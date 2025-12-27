import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Проверяем, существует ли модель в Prisma клиенте
    if (!prisma.featuredCategoryTile) {
      console.error('[featured-categories] FeaturedCategoryTile model not found in Prisma client. Please run: npx prisma generate')
      const errorResponse = successResponse([])
      errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      errorResponse.headers.set('Pragma', 'no-cache')
      errorResponse.headers.set('Expires', '0')
      return errorResponse
    }

    const tiles = await prisma.featuredCategoryTile.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    console.log(`[featured-categories] Found ${tiles.length} active category tiles`)
    const response = successResponse(tiles)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error: any) {
    console.error('[featured-categories] API error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
    
    // Если ошибка связана с отсутствием модели, возвращаем пустой массив
    if (error.message?.includes('featuredCategoryTile') || error.message?.includes('Cannot read properties')) {
      console.error('[featured-categories] Prisma client may need regeneration. Run: npx prisma generate')
      return successResponse([])
    }
    
    // Для ошибок подключения к БД также логируем подробности
    if (error.code === 'P1001' || error.code === 'P1017') {
      console.error('[featured-categories] Database connection error:', error.code)
    }
    
    return errorResponse('Ошибка при получении категорий', 500)
  }
}























