import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { ProductVisibility } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return successResponse([])
    }

    // Ограничиваем количество запросов
    const limitedIds = ids.slice(0, 20)

    const products = await prisma.product.findMany({
      where: {
        id: { in: limitedIds },
        visibility: ProductVisibility.VISIBLE,
        isActive: true,
      },
      include: {
        Category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      // Сохраняем порядок из запроса
      orderBy: {
        // Используем raw SQL для сохранения порядка
      },
    })

    // Сортируем продукты в порядке, указанном в ids
    const productMap = new Map(products.map((p) => [p.id, p]))
    const orderedProducts = limitedIds
      .map((id) => productMap.get(id))
      .filter((p) => p !== undefined)

    // Преобразуем для ответа
    const transformedProducts = orderedProducts.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      rating: product.rating ? Number(product.rating) : 0,
      badges: product.badges || [],
      tags: product.tags || [],
      images: product.images || [],
      stock: product.stock || 0,
      stockStatus: product.isInStock
        ? product.stock > 10
          ? 'MANY'
          : product.stock > 0
          ? 'ENOUGH'
          : 'FEW'
        : 'NONE',
      isInStock: product.isInStock,
    }))

    return successResponse(transformedProducts)
  } catch (error) {
    console.error('Products by IDs API error:', error)
    return errorResponse('Ошибка при получении товаров', 500)
  }
}




