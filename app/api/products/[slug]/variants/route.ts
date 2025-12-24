import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        productId: product.id,
        isActive: true,
      },
      orderBy: { sku: 'asc' },
    })

    return successResponse(variants)
  } catch (error) {
    console.error('Product variants GET error:', error)
    return errorResponse('Ошибка при получении вариантов', 500)
  }
}






















