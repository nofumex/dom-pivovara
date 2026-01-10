import { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { saveUploadedFile } from '@/lib/upload'
import { successResponse, errorResponse } from '@/lib/response'
import { existsSync, statSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      console.error('❌ Upload failed: Unauthorized')
      return errorResponse('Не авторизован', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      console.error('❌ Upload failed: No file provided')
      return errorResponse('Файл не предоставлен', 400)
    }

    console.log(`📤 Upload started: ${file.name} (${file.size} bytes, ${file.type})`)

    const subfolder = formData.get('subfolder') as string | null
    const result = await saveUploadedFile(file, subfolder || undefined)

    // Проверяем, что файл действительно существует по возвращенному пути
    const getUploadDir = () => {
      if (process.env.UPLOAD_DIR) {
        if (process.env.UPLOAD_DIR.startsWith('/')) {
          return process.env.UPLOAD_DIR
        }
        return join(process.cwd(), process.env.UPLOAD_DIR)
      }
      return join(process.cwd(), 'public', 'uploads')
    }
    
    const uploadDir = getUploadDir()
    const fullPath = subfolder 
      ? join(uploadDir, subfolder, result.filename)
      : join(uploadDir, result.filename)
    
    if (existsSync(fullPath)) {
      const stats = statSync(fullPath)
      console.log(`✅ Upload successful: ${result.url} (file exists: ${stats.size} bytes)`)
      
      // Возвращаем успешный ответ с заголовками для предотвращения кеширования
      return new Response(
        JSON.stringify({
          success: true,
          data: result,
          message: 'Файл загружен успешно',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )
    } else {
      console.error(`❌ Upload failed: File not found at ${fullPath}`)
      return errorResponse('Файл загружен, но не найден на диске', 500)
    }
  } catch (error: any) {
    console.error('❌ Upload error:', error)
    return errorResponse(error.message || 'Ошибка при загрузке файла', 500)
  }
}


























