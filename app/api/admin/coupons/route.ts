import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response'
import { z } from 'zod'

const createCouponSchema = z.object({
  code: z.string().min(1, 'Код обязателен'),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().min(0, 'Значение должно быть положительным'),
  minAmount: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  description: z.string().optional(),
})

const updateCouponSchema = createCouponSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Доступ запрещен', 403)
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    // Проверяем, что prisma.coupon существует
    if (!prisma.coupon) {
      console.error('Prisma client does not have coupon model. Run: npx prisma generate')
      return errorResponse('Сервис временно недоступен', 500)
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.coupon.count(),
    ])

    return paginatedResponse(coupons, page, limit, total)
  } catch (error) {
    console.error('Coupons GET error:', error)
    return errorResponse('Ошибка при получении купонов', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Доступ запрещен', 403)
    }

    const body = await request.json()
    const validated = createCouponSchema.parse(body)

    // Проверяем, не существует ли уже купон с таким кодом
    const existing = await prisma.coupon.findUnique({
      where: { code: validated.code.toUpperCase() },
    })

    if (existing) {
      return errorResponse('Купон с таким кодом уже существует', 400)
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: validated.code.toUpperCase(),
        type: validated.type,
        value: validated.value.toString(),
        minAmount: validated.minAmount?.toString(),
        maxDiscount: validated.maxDiscount?.toString(),
        usageLimit: validated.usageLimit,
        isActive: validated.isActive,
        validFrom: validated.validFrom ? new Date(validated.validFrom) : null,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
        description: validated.description,
      },
    })

    return successResponse(coupon, 'Купон создан успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Coupons POST error:', error)
    return errorResponse('Ошибка при создании купона', 500)
  }
}

















