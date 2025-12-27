import { prisma } from '@/lib/db'
import { ContactsContent } from './ContactsContent'
import { SettingType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  // Получаем магазины
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })

  // Получаем настройки контактов
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['contactEmail', 'contactPhone', 'contactPhone2', 'workingHours'],
      },
    },
  })

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
