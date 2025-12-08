import { NextRequest } from 'next/server'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { testSMTPConnection } from '@/lib/email'
import { z } from 'zod'

const testSMTPSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP хост обязателен'),
  smtpPort: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    if (isNaN(num) || num < 1 || num > 65535) {
      throw new Error('Некорректный порт')
    }
    return num
  }),
  smtpUser: z.string().min(1, 'SMTP пользователь обязателен'),
  smtpPassword: z.string().min(1, 'SMTP пароль обязателен'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = testSMTPSchema.parse(body)

    const result = await testSMTPConnection({
      smtpHost: validated.smtpHost,
      smtpPort: validated.smtpPort,
      smtpUser: validated.smtpUser,
      smtpPassword: validated.smtpPassword,
      fromEmail: '', // Не требуется для теста подключения
      companyEmail: '', // Не требуется для теста подключения
    })

    if (result.success) {
      return successResponse(result, result.message)
    } else {
      return errorResponse(result.message, 400, result.details)
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const firstError = error.errors[0]
      return errorResponse('Ошибка валидации', 400, firstError?.message)
    }
    console.error('Test SMTP error:', error)
    return errorResponse('Ошибка при тестировании SMTP подключения', 500)
  }
}

