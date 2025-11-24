import { NextRequest } from 'next/server'
import { deleteSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const refreshToken = body.refreshToken || request.cookies.get('refreshToken')?.value

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
    return errorResponse('Ошибка при выходе', 500)
  }
}

