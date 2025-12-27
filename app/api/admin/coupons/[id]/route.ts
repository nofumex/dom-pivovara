import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'

const updateCouponSchema = z.object({
  code: z.string().min(1).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  value: z.number().min(0).optional(),
  minAmount: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  description: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Доступ запрещен', 403)
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
    })

    if (!coupon) {
      return errorResponse('Купон не найден', 404)
    }

    return successResponse(coupon)
  } catch (error) {
    console.error('Coupon GET error:', error)
    return errorResponse('Ошибка при получении купона', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Доступ запрещен', 403)
    }

    const body = await request.json()
    const validated = updateCouponSchema.parse(body)

    // Если обновляется код, проверяем уникальность
    if (validated.code) {
      const existing = await prisma.coupon.findFirst({
        where: {
          code: validated.code.toUpperCase(),
          id: { not: params.id },
        },
      })

      if (existing) {
        return errorResponse('Купон с таким кодом уже существует', 400)
      }
    }

    const updateData: any = {}
    if (validated.code !== undefined) updateData.code = validated.code.toUpperCase()
    if (validated.type !== undefined) updateData.type = validated.type
    if (validated.value !== undefined) updateData.value = validated.value.toString()
    if (validated.minAmount !== undefined) updateData.minAmount = validated.minAmount?.toString() || null
    if (validated.maxDiscount !== undefined) updateData.maxDiscount = validated.maxDiscount?.toString() || null
    if (validated.usageLimit !== undefined) updateData.usageLimit = validated.usageLimit
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive
    if (validated.validFrom !== undefined) updateData.validFrom = validated.validFrom ? new Date(validated.validFrom) : null
    if (validated.validUntil !== undefined) updateData.validUntil = validated.validUntil ? new Date(validated.validUntil) : null
    if (validated.description !== undefined) updateData.description = validated.description

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: updateData,
    })

    return successResponse(coupon, 'Купон обновлен успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Coupon PATCH error:', error)
    return errorResponse('Ошибка при обновлении купона', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Доступ запрещен', 403)
    }

    await prisma.coupon.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'Купон удален успешно')
  } catch (error) {
    console.error('Coupon DELETE error:', error)
    return errorResponse('Ошибка при удалении купона', 500)
  }
}

















