import { NextRequest } from 'next/server'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'

const testEmailSchema = z.object({
  to: z.string().email('Некорректный email'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = testEmailSchema.parse(body)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Тестовое письмо</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">Тестовое письмо</h1>
            <p>Это тестовое письмо для проверки настройки email системы.</p>
            <p>Если вы получили это письмо, значит настройки SMTP работают корректно.</p>
            <p style="margin-top: 20px; color: #7f8c8d; font-size: 12px;">
              Отправлено из админ-панели интернет-магазина
            </p>
          </div>
        </body>
      </html>
    `

    const sent = await sendEmail(
      validated.to,
      'Тестовое письмо',
      html
    )

    if (!sent) {
      return errorResponse('Не удалось отправить письмо. Проверьте настройки SMTP.', 500)
    }

    return successResponse(null, 'Тестовое письмо отправлено успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Test email error:', error)
    return errorResponse('Ошибка при отправке тестового письма', 500)
  }
}



