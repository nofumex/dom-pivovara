import { getAuthUserWithRefresh } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { ImportExportManager } from '@/components/admin/ImportExportManager/ImportExportManager'

export default async function AdminImportExportPage() {
  const { user } = await getAuthUserWithRefresh()

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  return <ImportExportManager />
}




















