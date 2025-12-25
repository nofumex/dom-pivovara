import { NextRequest } from 'next/server'
import { prisma, withRetry } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { createLeadSchema } from '@/lib/validations'
import { sendNewLeadNotificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createLeadSchema.parse(body)

    // Создаем лид в БД с retry логикой для обработки временных ошибок подключения
    const lead = await withRetry(
      () =>
        prisma.lead.create({
          data: {
            name: validated.name,
            phone: validated.phone,
            email: validated.email,
            company: validated.company,
            message: validated.message,
            source: validated.source,
          },
        }),
      3, // 3 попытки
      1000, // Задержка 1 секунда
    )

    // Отправляем email админу асинхронно, не блокируем создание лида при ошибках
    sendNewLeadNotificationEmail(
      validated.source,
      validated.name,
      validated.phone || undefined,
      validated.email || undefined,
      validated.message || undefined
    )
      .then((success) => {
        if (success) {
          console.log('✅ Lead notification email sent successfully')
        } else {
          console.warn('⚠️ Lead notification email failed (email settings may not be configured)')
        }
      })
      .catch((error) => {
        // Логируем ошибку, но не блокируем ответ
        console.error('❌ Error sending lead notification email:', error)
        console.warn('⚠️ Lead created but email notification failed. Check email settings in admin panel.')
      })

    return successResponse(lead, 'Заявка создана успешно')
  } catch (error: any) {
    // Обработка ошибок подключения к БД
    if (error.code === 'P1001' || error.message?.includes("Can't reach database")) {
      console.error('❌ Database connection error:', error)
      return errorResponse(
        'Ошибка подключения к базе данных. Пожалуйста, попробуйте отправить сообщение позже.',
        503,
      )
    }

    if (error.code === 'P1017' || error.message?.includes('Server has closed the connection')) {
      console.error('❌ Database connection closed:', error)
      return errorResponse(
        'Соединение с базой данных было разорвано. Пожалуйста, попробуйте еще раз.',
        503,
      )
    }

    if (error.code?.startsWith('P')) {
      console.error('❌ Prisma error:', error)
      return errorResponse('Ошибка базы данных. Попробуйте позже.', 500)
    }

    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('❌ Leads POST error:', error)
    return errorResponse('Ошибка при создании заявки', 500)
  }
}









