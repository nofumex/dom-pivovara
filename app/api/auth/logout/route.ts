import { NextRequest } from 'next/server'
import { deleteSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    let refreshToken: string | undefined
    
    try {
      const body = await request.json().catch(() => ({}))
      refreshToken = body.refreshToken || request.cookies.get('refreshToken')?.value
    } catch {
      refreshToken = request.cookies.get('refreshToken')?.value
    }

    if (refreshToken) {
      await deleteSession(refreshToken)
    }

    // Clear cookies
    const cookieStore = await cookies()
    cookieStore.delete('accessToken')
    cookieStore.delete('refreshToken')

    return successResponse(null, 'Выход выполнен успешно')
  } catch (error) {
    console.error('Logout error:', error)
    // Все равно пытаемся очистить cookies
    try {
      const cookieStore = await cookies()
      cookieStore.delete('accessToken')
      cookieStore.delete('refreshToken')
    } catch {}
    return errorResponse('Ошибка при выходе', 500)
  }
}


























