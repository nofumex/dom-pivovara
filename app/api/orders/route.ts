import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response'
import { createOrderSchema } from '@/lib/validations'
import { generateOrderNumber } from '@/lib/utils'
import { OrderStatus } from '@prisma/client'
import { sendOrderConfirmationEmail, sendNewOrderNotificationEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  images: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    return paginatedResponse(orders, page, limit, total)
  } catch (error) {
    console.error('Orders GET error:', error)
    return errorResponse('Ошибка при получении заказов', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = createOrderSchema.parse(body)

    // Get products and calculate totals
    const productIds = validated.items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
        isInStock: true,
      },
    })

    if (products.length !== productIds.length) {
      return errorResponse('Некоторые товары не найдены или недоступны', 400)
    }

    let subtotal = 0
    const orderItems = []

    for (const item of validated.items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) {
        return errorResponse(`Товар ${item.productId} не найден`, 400)
      }

      if (product.stock < item.quantity) {
        return errorResponse(`Недостаточно товара ${product.title}`, 400)
      }

      const price = parseFloat(product.price.toString())
      const itemTotal = price * item.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: product.id,
        variantId: item.variantId,
        quantity: item.quantity,
        price: price.toString(),
        total: itemTotal.toString(),
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
      })
    }

    const deliveryCost = validated.deliveryType === 'PICKUP' ? 0 : 500 // Пример стоимости доставки
    const discount = 0 // Можно добавить логику промокодов
    const total = subtotal + deliveryCost - discount

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        status: OrderStatus.NEW,
        subtotal: subtotal.toString(),
        delivery: deliveryCost.toString(),
        discount: discount.toString(),
        total: total.toString(),
        firstName: validated.firstName,
        lastName: validated.lastName,
        company: validated.company,
        phone: validated.phone,
        email: validated.email,
        notes: validated.notes,
        deliveryType: validated.deliveryType,
        addressId: validated.addressId,
        promoCode: validated.promoCode,
        items: {
          create: orderItems,
        },
        logs: {
          create: {
            status: OrderStatus.NEW,
            comment: 'Заказ создан',
            createdBy: user.id,
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
    })

    // Update product stock
    for (const item of validated.items) {
      const product = products.find((p) => p.id === item.productId)
      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      }
    }

    // Send emails
    const orderItemsForEmail = order.items.map((item) => ({
      title: item.product.title,
      quantity: item.quantity,
      price: parseFloat(item.price.toString()),
    }))

    // Send confirmation email to customer
    await sendOrderConfirmationEmail(
      order.orderNumber,
      validated.email,
      total,
      orderItemsForEmail
    )

    // Send notification email to admin
    const deliveryAddress = order.address
      ? `${order.address.street}, ${order.address.city}, ${order.address.region}, ${order.address.zipCode}`
      : undefined

    await sendNewOrderNotificationEmail(
      order.orderNumber,
      `${validated.firstName} ${validated.lastName}`,
      validated.email,
      validated.phone,
      total,
      deliveryAddress
    )

    return successResponse({ order, orderNumber: order.orderNumber }, 'Заказ создан успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Orders POST error:', error)
    return errorResponse('Ошибка при создании заказа', 500)
  }
}

