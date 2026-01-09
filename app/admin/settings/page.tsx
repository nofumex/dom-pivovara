import { prisma } from '@/lib/db'
import { getAuthUserWithRefresh } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/admin/SettingsForm/SettingsForm'
import { CouponsManager } from '@/components/admin/CouponsManager/CouponsManager'
import { SettingType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const { user } = await getAuthUserWithRefresh()

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  const settings = await prisma.setting.findMany()
  const settingsMap: Record<string, any> = {}
  
  // Правильно парсим настройки в соответствии с их типами
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
    settingsMap[setting.key] = value
  }

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>
        Настройки
      </h1>
      <SettingsForm settings={settingsMap} />
      <CouponsManager />
    </div>
  )
}

