import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

interface Params {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()

    const tile = await prisma.featuredCategoryTile.update({
      where: { id: params.id },
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
    console.error('Admin featured categories PUT error:', error)
    return errorResponse('Ошибка при обновлении категории', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await prisma.featuredCategoryTile.delete({
      where: { id: params.id },
    })

    return successResponse({ success: true })
  } catch (error) {
    console.error('Admin featured categories DELETE error:', error)
    return errorResponse('Ошибка при удалении категории', 500)
  }
}







