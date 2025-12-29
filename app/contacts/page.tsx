import { prisma } from '@/lib/db'
import { ContactsContent } from './ContactsContent'
import { SettingType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  // Получаем магазины
  let stores: Array<{ id: string; address: string; mapUrl: string; order: number; isActive: boolean }> = []
  try {
    stores = await prisma.store.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  } catch (error) {
    console.error('Error fetching stores:', error)
    // Продолжаем с пустым массивом
  }

  // Получаем настройки контактов
  let settings: Array<{ key: string; value: string }> = []
  try {
    settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['contactEmail', 'contactPhone', 'contactPhone2', 'workingHours'],
        },
      },
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    // Продолжаем с пустым массивом
  }

  const settingsMap: Record<string, string> = {}
  for (const setting of settings) {
    settingsMap[setting.key] = setting.value
  }

  return (
    <ContactsContent
      stores={stores.map((store) => ({
        id: store.id,
        address: store.address,
        mapUrl: store.mapUrl,
      }))}
      contactEmail={settingsMap.contactEmail}
      contactPhone={settingsMap.contactPhone}
      contactPhone2={settingsMap.contactPhone2}
      workingHours={settingsMap.workingHours}
    />
  )
}
