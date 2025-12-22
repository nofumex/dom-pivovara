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
          OrderItem: {
            include: {
              Product: {
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
    // Авторизация не обязательна - заказ можно оформить без регистрации
    const user = await verifyAuth(request).catch(() => null)

    const body = await request.json()
    const validated = createOrderSchema.parse(body)

    // Get products and calculate totals
    const productIds = validated.items.map((item) => item.productId)
    
    // Сначала получаем все товары без фильтров, чтобы понять, какие именно не найдены
    const allProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    })

    // Проверяем, все ли товары найдены
    const foundProductIds = new Set(allProducts.map(p => p.id))
    const missingProductIds = productIds.filter(id => !foundProductIds.has(id))
    
    if (missingProductIds.length > 0) {
      return errorResponse(
        `Товары с ID ${missingProductIds.join(', ')} не найдены в базе данных`,
        400
      )
    }

    // Проверяем активность товаров (неактивные товары не должны быть в корзине, но проверяем на всякий случай)
    const inactiveProducts = allProducts.filter(p => !p.isActive)
    
    if (inactiveProducts.length > 0) {
      const inactiveTitles = inactiveProducts.map(p => p.title).join(', ')
      console.warn(`Попытка заказать неактивные товары: ${inactiveTitles}`)
      // Не блокируем заказ, но логируем предупреждение
    }

    // Проверяем наличие на складе (isInStock может быть false, но товар все равно может быть доступен)
    // Проверяем только реальное количество на складе (stock)
    const products = allProducts

    let subtotal = 0
    const orderItems = []

    for (const item of validated.items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) {
        return errorResponse(`Товар ${item.productId} не найден`, 400)
      }

      // Проверяем только реальное количество на складе, а не флаг isInStock
      if (product.stock < item.quantity) {
        return errorResponse(`Недостаточно товара "${product.title}" на складе. Доступно: ${product.stock}, запрошено: ${item.quantity}`, 400)
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

    const deliveryCost = validated.deliveryType === 'PICKUP' ? 0 : 300
    
    // Применяем купон, если указан
    let discount = 0
    let couponId: string | undefined = undefined
    if (validated.promoCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: validated.promoCode.toUpperCase() },
      })

      if (coupon && coupon.isActive) {
        const now = new Date()
        const isValidDate = 
          (!coupon.validFrom || now >= coupon.validFrom) &&
          (!coupon.validUntil || now <= coupon.validUntil)
        const isValidUsage = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit
        const isValidAmount = !coupon.minAmount || subtotal >= parseFloat(coupon.minAmount.toString())

        if (isValidDate && isValidUsage && isValidAmount) {
          if (coupon.type === 'PERCENTAGE') {
            discount = (subtotal * parseFloat(coupon.value.toString())) / 100
            if (coupon.maxDiscount) {
              discount = Math.min(discount, parseFloat(coupon.maxDiscount.toString()))
            }
          } else if (coupon.type === 'FIXED') {
            discount = parseFloat(coupon.value.toString())
            discount = Math.min(discount, subtotal)
          }
          discount = Math.round(discount * 100) / 100
          couponId = coupon.id

          // Увеличиваем счетчик использований
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          })
        }
      }
    }
    
    const total = subtotal + deliveryCost - discount

    // Для неавторизованных пользователей создаем или находим гостевого пользователя
    let orderUserId = user?.id
    if (!orderUserId) {
      // Ищем или создаем гостевого пользователя
      const guestUser = await prisma.user.findUnique({
        where: { email: 'guest@system.local' },
      })
      
      if (guestUser) {
        orderUserId = guestUser.id
      } else {
        // Создаем гостевого пользователя (пароль не нужен, так как он не будет использоваться)
        const newGuestUser = await prisma.user.create({
          data: {
            email: 'guest@system.local',
            password: 'guest', // Пароль не используется
            firstName: 'Гость',
            lastName: 'Система',
            role: 'CUSTOMER',
          },
        })
        orderUserId = newGuestUser.id
      }
    }

    // Generate IDs for nested creates
    const orderId = crypto.randomUUID()
    const orderItemsWithIds = orderItems.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    }))
    const orderLogId = crypto.randomUUID()

    // Create order
    const now = new Date()
    const order = await prisma.order.create({
      data: {
        id: orderId,
        orderNumber: generateOrderNumber(),
        userId: orderUserId,
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
        updatedAt: now,
        OrderItem: {
          create: orderItemsWithIds,
        },
        OrderLog: {
          create: {
            id: orderLogId,
            status: OrderStatus.NEW,
            comment: user ? 'Заказ создан' : 'Заказ создан (гость)',
            createdBy: orderUserId,
          },
        },
      },
      include: {
        OrderItem: {
          include: {
            Product: true,
          },
        },
        Address: true,
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

    // Send emails (не блокируем создание заказа при ошибках отправки)
    const orderItemsForEmail = order.OrderItem.map((item) => ({
      title: item.Product.title,
      quantity: item.quantity,
      price: parseFloat(item.price.toString()),
    }))

    // Отправляем email асинхронно, не ждем результата
    Promise.allSettled([
      sendOrderConfirmationEmail(
        order.orderNumber,
        validated.email,
        total,
        orderItemsForEmail,
        `${validated.firstName} ${validated.lastName}`.trim()
      ),
      (async () => {
        const deliveryAddress = order.Address
          ? `${order.Address.street}, ${order.Address.city}, ${order.Address.region}, ${order.Address.zipCode}`
          : undefined

        return sendNewOrderNotificationEmail(
          order.orderNumber,
          `${validated.firstName} ${validated.lastName}`,
          validated.email,
          validated.phone,
          total,
          deliveryAddress
        )
      })(),
    ]).then((results) => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          // Логируем как предупреждение, так как это не критично для создания заказа
          console.warn(`Email send timeout/error (${index === 0 ? 'customer' : 'admin'}):`, result.reason?.message || result.reason)
        } else if (result.status === 'fulfilled' && !result.value) {
          console.warn(`Email send failed (${index === 0 ? 'customer' : 'admin'}) - check email settings`)
        }
      })
    }).catch((error) => {
      console.warn('Unexpected error in email sending:', error)
    })

    return successResponse({ order, orderNumber: order.orderNumber }, 'Заказ создан успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('Validation error:', error.errors)
      const errorMessage = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
      return errorResponse('Ошибка валидации', 400, errorMessage)
    }
    console.error('Orders POST error:', error)
    return errorResponse('Ошибка при создании заказа', 500)
  }
}

