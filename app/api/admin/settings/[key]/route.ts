import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole, SettingType } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { z } from 'zod'

const settingValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.object({}).passthrough(),
  z.array(z.any()),
])

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const setting = await prisma.setting.findUnique({
      where: { key: params.key },
    })

    if (!setting) {
      return errorResponse('Настройка не найдена', 404)
    }

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

    return successResponse({ key: setting.key, value, type: setting.type })
  } catch (error) {
    console.error('Admin setting GET error:', error)
    return errorResponse('Ошибка при получении настройки', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const body = await request.json()
    const validated = settingValueSchema.parse(body.value)

    let stringValue: string
    let type: SettingType = SettingType.STRING

    if (typeof validated === 'object' && validated !== null) {
      stringValue = JSON.stringify(validated)
      type = SettingType.JSON
    } else if (typeof validated === 'number') {
      stringValue = validated.toString()
      type = SettingType.NUMBER
    } else if (typeof validated === 'boolean') {
      stringValue = validated.toString()
      type = SettingType.BOOLEAN
    } else {
      stringValue = String(validated)
    }

    const setting = await prisma.setting.upsert({
      where: { key: params.key },
      update: { value: stringValue, type },
      create: { key: params.key, value: stringValue, type },
    })

    return successResponse(setting, 'Настройка обновлена успешно')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Admin setting PUT error:', error)
    return errorResponse('Ошибка при обновлении настройки', 500)
  }
}



