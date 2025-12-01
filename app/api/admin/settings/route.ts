import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole, SettingType } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'

const settingsSchema = z.object({
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  minOrderTotal: z.number().optional(),
  socialLinks: z.array(z.object({
    label: z.string(),
    url: z.string().url(),
  })).optional(),
  extraContacts: z.array(z.object({
    title: z.string(),
    values: z.array(z.string()),
  })).optional(),
  emailSettings: z.object({
    smtpHost: z.string(),
    smtpPort: z.number(),
    smtpUser: z.string(),
    smtpPassword: z.string(),
    fromEmail: z.string().email(),
    companyEmail: z.string().email(),
  }).optional(),
  popupEnabled: z.boolean().optional(),
  popupTemplate: z.string().optional(),
  popupTitle: z.string().optional(),
  popupText: z.string().optional(),
  popupImageUrl: z.string().optional(),
  popupButtonLabel: z.string().optional(),
  popupButtonUrl: z.string().optional(),
  popupDelaySeconds: z.number().optional(),
}).passthrough()

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
        create: { key, value: stringValue, type },
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



