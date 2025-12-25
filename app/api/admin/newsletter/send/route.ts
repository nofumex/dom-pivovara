import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { getAuthUserWithRefresh } from '@/lib/auth-helpers'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { SettingType } from '@prisma/client'
import { buildMarketingEmail } from '@/lib/email'

const sendNewsletterSchema = z.object({
  subject: z.string().min(1, 'Тема обязательна'),
  content: z.string().min(1, 'Содержимое обязательно'),
  isHtml: z.boolean().optional().default(false),
  useTemplate: z.boolean().optional().default(true),
  preheader: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().url().optional(),
  badgeLabel: z.string().optional(),
})

interface EmailSettings {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  fromEmail: string
  companyEmail: string
}

async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'emailSettings' },
    })

    if (!setting || setting.type !== SettingType.JSON) {
      return null
    }

    return JSON.parse(setting.value) as EmailSettings
  } catch {
    return null
  }
}

function isIPAddress(host: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  return ipRegex.test(host)
}

function getDomainNameForIP(ip: string): string | null {
  const knownIPs: Record<string, string> = {
    '77.88.21.158': 'smtp.yandex.ru',
    '77.88.8.88': 'smtp.yandex.ru',
    '94.100.180.201': 'smtp.mail.ru',
    '217.69.139.24': 'smtp.mail.ru',
    '74.125.24.108': 'smtp.gmail.com',
    '74.125.200.108': 'smtp.gmail.com',
  }
  return knownIPs[ip] || null
}

async function createTransporter(settings: EmailSettings) {
  const isIP = isIPAddress(settings.smtpHost)
  const host = isIP ? getDomainNameForIP(settings.smtpHost) || settings.smtpHost : settings.smtpHost

  return nodemailer.createTransport({
    host,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUserWithRefresh()

    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Доступ запрещен', 403)
    }

    const body = await request.json()
    const validated = sendNewsletterSchema.parse(body)

    // Получаем настройки email
    const emailSettings = await getEmailSettings()
    if (!emailSettings) {
      return errorResponse('Настройки email не найдены. Настройте SMTP в админ-панели.', 400)
    }

    // Получаем список активных подписчиков
    const subscribers = await prisma.emailSubscription.findMany({
      where: { isActive: true },
      select: { email: true },
    })

    if (subscribers.length === 0) {
      return errorResponse('Нет активных подписчиков для рассылки', 400)
    }

    // Создаем транспортер
    const transporter = await createTransporter(emailSettings)
    
    // Проверяем подключение к SMTP
    try {
      await transporter.verify()
      console.log('✅ SMTP connection verified')
    } catch (verifyError: any) {
      console.error('❌ SMTP verification failed:', verifyError)
      return errorResponse('Ошибка подключения к SMTP серверу', 500, verifyError.message)
    }

    // Подготавливаем оформление письма
    const built = validated.useTemplate
      ? buildMarketingEmail(validated.subject, validated.content, validated.isHtml, {
          preheader: validated.preheader,
          ctaLabel: validated.ctaLabel,
          ctaUrl: validated.ctaUrl,
          badgeLabel: validated.badgeLabel,
        })
      : {
          subject: validated.subject,
          html: validated.isHtml ? validated.content : validated.content.replace(/\n/g, '<br />'),
          text: validated.isHtml ? undefined : validated.content,
        }

    // Отправляем письма
    let sentCount = 0
    let failedCount = 0
    const errors: string[] = []

    console.log(`📧 Начинаем рассылку для ${subscribers.length} подписчиков`)

    // Отправляем письма последовательно с небольшой задержкой
    for (const subscriber of subscribers) {
      try {
        const result = await transporter.sendMail({
          from: `"Дом Пивовара" <${emailSettings.fromEmail}>`,
          to: subscriber.email,
          subject: built.subject,
          text: built.text,
          html: built.html,
        })
        sentCount++
        console.log(`✅ Отправлено на ${subscriber.email}, messageId: ${result.messageId}`)
        
        // Небольшая задержка между письмами, чтобы не перегружать SMTP сервер
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error: any) {
        failedCount++
        errors.push(`${subscriber.email}: ${error.message}`)
        console.error(`Error sending to ${subscriber.email}:`, error)
      }
    }

    console.log(`📊 Результаты рассылки: ${sentCount} отправлено, ${failedCount} ошибок из ${subscribers.length} подписчиков`)

    if (sentCount === 0) {
      console.error('❌ Все попытки отправки провалились')
      return errorResponse(
        'Не удалось отправить рассылку ни одному подписчику',
        500,
        errors[0] || 'SMTP ошибка'
      )
    }

    return successResponse(
      {
        sentCount,
        failedCount,
        totalCount: subscribers.length,
        errors: errors.slice(0, 10), // Возвращаем только первые 10 ошибок
      },
      `Рассылка завершена: ${sentCount} отправлено, ${failedCount} ошибок`
    )
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Error sending newsletter:', error)
    return errorResponse('Ошибка при отправке рассылки', 500)
  }
}

