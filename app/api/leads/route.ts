import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { createLeadSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createLeadSchema.parse(body)

    const lead = await prisma.lead.create({
      data: validated,
    })

    return successResponse(lead, 'Заявка создана успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Leads POST error:', error)
    return errorResponse('Ошибка при создании заявки', 500)
  }
}


