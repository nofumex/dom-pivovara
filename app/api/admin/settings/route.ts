import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole, SettingType } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'
import { randomUUID } from 'crypto'

// Разрешаем в optional-полях как корректные значения, так и пустые строки,
// а числовые значения приводим из строк (как это делает админская форма)
const optionalEmailSchema = z
  .string()
  .email()
  .or(z.literal(''))
  .optional()

const optionalNumberSchema = z.coerce.number().optional()

const settingsSchema = z
  .object({
    contactEmail: optionalEmailSchema,
    contactPhone: z.string().optional(),
    contactPhone2: z.string().optional(),
    workingHours: z.string().optional(),

    minOrderTotal: optionalNumberSchema,

    socialLinks: z
      .array(
        z.object({
          label: z.string(),
          // В UI по умолчанию URL может быть пустым, поэтому разрешаем '' и валидный URL
          url: z.string().url().or(z.literal('')),
        }),
      )
      .optional(),

    emailSettings: z
      .object({
        smtpHost: z.string().optional(),
        smtpPort: optionalNumberSchema,
        smtpUser: z.string().optional(),
        smtpPassword: z.string().optional(),
        fromEmail: optionalEmailSchema,
        fromName: z.string().optional(),
        companyEmail: optionalEmailSchema,
      })
      .optional(),

    // Интервал слайдера главного баннера
    heroSliderInterval: optionalNumberSchema,
  })
  .passthrough()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    })

    // Transform settings to object
    const settingsObj: Record<string, any> = {}
    for (const setting of settings) {
      let value: any = setting.value
      if (setting.type === SettingType.JSON) {
        try {
          value = JSON.parse(setting.value)
        } catch {
          value = setting.value
        }
      } else if (setting.type === SettingType.NUMBER) {
        value = parseFloat(setting.value)
      } else if (setting.type === SettingType.BOOLEAN) {
        value = setting.value === 'true'
      }
      settingsObj[setting.key] = value
    }

    return successResponse(settingsObj)
  } catch (error) {
    console.error('Admin settings GET error:', error)
    return errorResponse('Ошибка при получении настроек', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = settingsSchema.parse(body)

    // Update or create each setting
    for (const [key, value] of Object.entries(validated)) {
      let stringValue: string
      let type: SettingType = SettingType.STRING

      if (typeof value === 'object' && value !== null) {
        stringValue = JSON.stringify(value)
        type = SettingType.JSON
      } else if (typeof value === 'number') {
        stringValue = value.toString()
        type = SettingType.NUMBER
      } else if (typeof value === 'boolean') {
        stringValue = value.toString()
        type = SettingType.BOOLEAN
      } else {
        stringValue = String(value)
      }

      await prisma.setting.upsert({
        where: { key },
        update: { value: stringValue, type },
        create: { id: randomUUID(), key, value: stringValue, type },
      })
    }

    return successResponse(null, 'Настройки обновлены успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin settings PUT error:', error)
    return errorResponse('Ошибка при обновлении настроек', 500)
  }
}







