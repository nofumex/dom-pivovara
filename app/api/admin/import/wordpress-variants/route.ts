import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const { productSlug, variants } = body

    if (!productSlug || !variants || !Array.isArray(variants)) {
      return errorResponse('Неверный формат данных', 400)
    }

    const product = await prisma.product.findUnique({
      where: { slug: productSlug },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    const result = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    }

    for (const variantData of variants) {
      try {
        if (!variantData.sku) {
          result.errors.push('Отсутствует SKU для варианта')
          continue
        }

        await prisma.productVariant.upsert({
          where: { sku: variantData.sku },
          update: {
            size: variantData.size,
            color: variantData.color,
            material: variantData.material,
            price: variantData.price?.toString() || product.price.toString(),
            stock: variantData.stock || 0,
            imageUrl: variantData.imageUrl,
            isActive: variantData.isActive !== false,
          },
          create: {
            productId: product.id,
            size: variantData.size,
            color: variantData.color,
            material: variantData.material,
            price: variantData.price?.toString() || product.price.toString(),
            stock: variantData.stock || 0,
            sku: variantData.sku,
            imageUrl: variantData.imageUrl,
            isActive: variantData.isActive !== false,
          },
        })

        result.updated++
      } catch (error: any) {
        result.errors.push(`Ошибка при импорте варианта ${variantData.sku}: ${error.message}`)
      }
    }

    return successResponse(result, 'Импорт вариантов завершен')
  } catch (error: any) {
    console.error('WordPress variants import error:', error)
    return errorResponse(`Ошибка при импорте вариантов: ${error.message}`, 500)
  }
}




















