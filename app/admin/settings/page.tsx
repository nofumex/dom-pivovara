import { prisma } from '@/lib/db'
import { getAuthUserFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { SettingsForm } from '@/components/admin/SettingsForm/SettingsForm'

export default async function AdminSettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  if (!token) {
    redirect('/admin/login')
  }

  try {
    const user = await getAuthUserFromCookies(token)
    if (!user || user.role !== 'ADMIN') {
      redirect('/admin/login')
    }
  } catch {
    redirect('/admin/login')
  }

  const settings = await prisma.setting.findMany()
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>)

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px' }}>
        Настройки
      </h1>
      <SettingsForm settings={settingsMap} />
    </div>
  )
}
