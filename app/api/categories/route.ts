import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeProducts = searchParams.get('includeProducts') === 'true'
    const parentId = searchParams.get('parentId')

    const where: any = {
      isActive: true,
    }

    if (parentId) {
      where.parentId = parentId
    } else {
      where.parentId = null
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        children: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          ...(includeProducts && {
            include: {
              _count: {
                select: {
                  products: {
                    where: {
                      isActive: true,
                      visibility: 'VISIBLE',
                    },
                  },
                },
              },
            },
          }),
        },
        ...(includeProducts && {
          _count: {
            select: {
              products: {
                where: {
                  isActive: true,
                  visibility: 'VISIBLE',
                },
              },
            },
          },
        }),
      },
    })

    return successResponse(categories)
  } catch (error) {
    console.error('Categories API error:', error)
    return errorResponse('Ошибка при получении категорий', 500)
  }
}


