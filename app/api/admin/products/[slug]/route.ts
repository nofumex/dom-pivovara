import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { createProductSchema } from '@/lib/validations'
import { serializeObject } from '@/lib/serialize'
import { calculateStockStatus } from '@/lib/stock'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        Category: true,
        ProductVariant: true,
        Review: {
          include: {
            User: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    // Сериализуем Decimal поля перед отправкой
    const serializedProduct = serializeObject(product)
    return successResponse(serializedProduct)
  } catch (error) {
    console.error('Admin product GET error:', error)
    return errorResponse('Ошибка при получении товара', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = createProductSchema.partial().parse(body)

    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    // Check SKU uniqueness if changed
    if (validated.sku && validated.sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: validated.sku },
      })
      if (existingSku) {
        return errorResponse('Товар с таким SKU уже существует', 409)
      }
    }

    // Check slug uniqueness if changed
    if (validated.slug && validated.slug !== product.slug) {
      const existingSlug = await prisma.product.findUnique({
        where: { slug: validated.slug },
      })
      if (existingSlug) {
        return errorResponse('Товар с таким slug уже существует', 409)
      }
    }

    const { category, ...rest } = validated
    const updateData: any = { ...rest }
    
    // Обновляем updatedAt при любом изменении
    updateData.updatedAt = new Date()
    
    // Автоматически обновляем stockStatus при изменении stock
    if (validated.stock !== undefined) {
      updateData.stockStatus = calculateStockStatus(validated.stock)
      updateData.isInStock = validated.stock > 0
    }
    
    if (validated.price !== undefined) {
      updateData.price = validated.price.toString()
    }
    if (validated.oldPrice !== undefined) {
      updateData.oldPrice = validated.oldPrice?.toString() || null
    }
    if (validated.weight !== undefined) {
      updateData.weight = validated.weight ? validated.weight.toString() : null
    }

    // Удаляем undefined поля
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const updated = await prisma.product.update({
      where: { slug: params.slug },
      data: updateData,
      include: {
        Category: true,
        ProductVariant: true,
      },
    })

    // Сериализуем Decimal поля перед отправкой
    const serializedUpdated = serializeObject(updated)
    return successResponse(serializedUpdated, 'Товар обновлен успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin product PUT error:', error)
    return errorResponse('Ошибка при обновлении товара', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    await prisma.product.delete({
      where: { slug: params.slug },
    })

    return successResponse(null, 'Товар удален успешно')
  } catch (error) {
    console.error('Admin product DELETE error:', error)
    return errorResponse('Ошибка при удалении товара', 500)
  }
}




