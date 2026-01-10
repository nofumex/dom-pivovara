import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'

const variantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  price: z.number().positive('Цена должна быть положительной'),
  stock: z.number().int().min(0),
  sku: z.string().min(1, 'SKU обязателен'),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string; variantId: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: params.variantId },
    })

    if (!variant || variant.productId !== product.id) {
      return errorResponse('Вариант не найден', 404)
    }

    const body = await request.json()
    const validated = variantSchema.partial().parse(body)

    // Check SKU uniqueness if changed
    if (validated.sku && validated.sku !== variant.sku) {
      const existingSku = await prisma.productVariant.findUnique({
        where: { sku: validated.sku },
      })
      if (existingSku) {
        return errorResponse('Вариант с таким SKU уже существует', 409)
      }
    }

    const updateData: any = { ...validated }
    if (validated.price !== undefined) {
      updateData.price = validated.price.toString()
    }
    
    // Удаляем undefined поля и нормализуем null значения
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      } else if (updateData[key] === '') {
        updateData[key] = null
      }
    })

    const updated = await prisma.productVariant.update({
      where: { id: params.variantId },
      data: updateData,
    })

    return successResponse(updated, 'Вариант обновлен успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin variant PUT error:', error)
    return errorResponse('Ошибка при обновлении варианта', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; variantId: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: params.variantId },
    })

    if (!variant || variant.productId !== product.id) {
      return errorResponse('Вариант не найден', 404)
    }

    await prisma.productVariant.delete({
      where: { id: params.variantId },
    })

    return successResponse(null, 'Вариант удален успешно')
  } catch (error) {
    console.error('Admin variant DELETE error:', error)
    return errorResponse('Ошибка при удалении варианта', 500)
  }
}

























