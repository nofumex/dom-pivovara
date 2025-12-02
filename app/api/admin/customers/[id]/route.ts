import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const customer = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        Address: true,
        Order: {
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
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!customer) {
      return errorResponse('Клиент не найден', 404)
    }

    return successResponse(customer)
  } catch (error) {
    console.error('Admin customer GET error:', error)
    return errorResponse('Ошибка при получении клиента', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, company, role, isBlocked } = body

    const customer = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!customer) {
      return errorResponse('Клиент не найден', 404)
    }

    // Check email uniqueness if changed
    if (email && email !== customer.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })
      if (existingUser) {
        return errorResponse('Пользователь с таким email уже существует', 409)
      }
    }

    const updateData: any = {}
    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (email) updateData.email = email
    if (phone !== undefined) updateData.phone = phone || null
    if (company !== undefined) updateData.company = company || null
    if (role) updateData.role = role
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isBlocked: true,
      },
    })

    return successResponse(updated, 'Клиент обновлен успешно')
  } catch (error) {
    console.error('Admin customer PUT error:', error)
    return errorResponse('Ошибка при обновлении клиента', 500)
  }
}





