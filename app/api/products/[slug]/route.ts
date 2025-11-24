import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { ProductVisibility } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        slug: params.slug,
        visibility: ProductVisibility.VISIBLE,
        isActive: true,
      },
      include: {
        categoryObj: {
          include: {
            parent: true,
          },
        },
        variants: {
          where: {
            isActive: true,
          },
        },
        reviews: {
          where: {
            isActive: true,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    return successResponse(product)
  } catch (error) {
    console.error('Product API error:', error)
    return errorResponse('Ошибка при получении товара', 500)
  }
}

