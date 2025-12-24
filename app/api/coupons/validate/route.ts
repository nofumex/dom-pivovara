import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'

const validateCouponSchema = z.object({
  code: z.string().min(1, 'Код обязателен'),
  amount: z.number().min(0, 'Сумма должна быть положительной'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = validateCouponSchema.parse(body)

    // Проверяем, что prisma.coupon существует
    if (!prisma.coupon) {
      console.error('Prisma client does not have coupon model. Run: npx prisma generate')
      return errorResponse('Сервис временно недоступен', 500)
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: validated.code.toUpperCase() },
    })

    if (!coupon) {
      return errorResponse('Купон с таким кодом не найден', 404)
    }

    if (!coupon.isActive) {
      return errorResponse('Этот купон неактивен', 400)
    }

    // Проверка срока действия
    const now = new Date()
    if (coupon.validFrom && now < coupon.validFrom) {
      return errorResponse('Купон еще не действителен', 400)
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return errorResponse('Срок действия купона истек', 400)
    }

    // Проверка лимита использования
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return errorResponse('Лимит использований купона исчерпан', 400)
    }

    // Проверка минимальной суммы
    if (coupon.minAmount && validated.amount < parseFloat(coupon.minAmount.toString())) {
      return errorResponse(`Минимальная сумма заказа для этого купона: ${parseFloat(coupon.minAmount.toString())} ₽`, 400)
    }

    // Расчет скидки
    let discount = 0
    if (coupon.type === 'PERCENTAGE') {
      discount = (validated.amount * parseFloat(coupon.value.toString())) / 100
      // Применяем максимальную скидку, если указана
      if (coupon.maxDiscount) {
        discount = Math.min(discount, parseFloat(coupon.maxDiscount.toString()))
      }
    } else if (coupon.type === 'FIXED') {
      discount = parseFloat(coupon.value.toString())
      // Скидка не может быть больше суммы заказа
      discount = Math.min(discount, validated.amount)
    }

    return successResponse({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: parseFloat(coupon.value.toString()),
        description: coupon.description,
      },
      discount: Math.round(discount * 100) / 100, // Округляем до 2 знаков
      finalAmount: Math.round((validated.amount - discount) * 100) / 100,
    }, 'Купон действителен')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Coupon validate error:', error)
    return errorResponse('Ошибка при проверке купона', 500)
  }
}














