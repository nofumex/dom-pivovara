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
      select: { id: true },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'asc' },
    })

    return successResponse(variants)
  } catch (error) {
    console.error('Admin variants GET error:', error)
    return errorResponse('Ошибка при получении вариантов', 500)
  }
}

export async function POST(
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
      select: { id: true },
    })

    if (!product) {
      return errorResponse('Товар не найден', 404)
    }

    const body = await request.json()
    const validated = variantSchema.parse(body)

    // Check if SKU exists
    const existingSku = await prisma.productVariant.findUnique({
      where: { sku: validated.sku },
    })
    if (existingSku) {
      return errorResponse('Вариант с таким SKU уже существует', 409)
    }

    const variant = await prisma.productVariant.create({
      data: {
        ...validated,
        productId: product.id,
        price: validated.price.toString(),
      },
    })

    return successResponse(variant, 'Вариант создан успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin variants POST error:', error)
    return errorResponse('Ошибка при создании варианта', 500)
  }
}







