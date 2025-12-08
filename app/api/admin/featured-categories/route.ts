import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const tiles = await prisma.featuredCategoryTile.findMany({
      orderBy: { order: 'asc' },
    })

    return successResponse(tiles)
  } catch (error) {
    console.error('Admin featured categories GET error:', error)
    return errorResponse('Ошибка при получении категорий', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const tile = await prisma.featuredCategoryTile.create({
      data: {
        title: body.title,
        url: body.url,
        imageUrl: body.imageUrl,
        size: body.size ?? 'medium',
        order: body.order ?? 0,
        isActive: body.isActive ?? true,
        updatedAt: new Date(),
      },
    })

    return successResponse(tile)
  } catch (error) {
    console.error('Admin featured categories POST error:', error)
    return errorResponse('Ошибка при создании категории', 500)
  }
}







