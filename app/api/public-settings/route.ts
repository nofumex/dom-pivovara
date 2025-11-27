import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

const PUBLIC_SETTINGS_KEYS = [
  'contactEmail',
  'contactPhone',
  'address',
  'socialLinks',
  'extraContacts',
]

export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: PUBLIC_SETTINGS_KEYS,
        },
      },
    })

    const settingsMap: Record<string, any> = {}
    settings.forEach((setting) => {
      if (setting.type === 'JSON') {
        try {
          settingsMap[setting.key] = JSON.parse(setting.value)
        } catch {
          settingsMap[setting.key] = setting.value
        }
      } else if (setting.type === 'BOOLEAN') {
        settingsMap[setting.key] = setting.value === 'true'
      } else if (setting.type === 'NUMBER') {
        settingsMap[setting.key] = parseFloat(setting.value)
      } else {
        settingsMap[setting.key] = setting.value
      }
    })

    return successResponse(settingsMap)
  } catch (error) {
    console.error('Public settings API error:', error)
    return errorResponse('Ошибка при получении настроек', 500)
  }
}


