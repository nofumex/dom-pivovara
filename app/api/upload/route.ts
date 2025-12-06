import { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { saveUploadedFile } from '@/lib/upload'
import { successResponse, errorResponse } from '@/lib/response'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return errorResponse('Файл не предоставлен', 400)
    }

    const subfolder = formData.get('subfolder') as string | null
    const result = await saveUploadedFile(file, subfolder || undefined)

    return successResponse(result, 'Файл загружен успешно')
  } catch (error: any) {
    console.error('Upload error:', error)
    return errorResponse(error.message || 'Ошибка при загрузке файла', 500)
  }
}









