import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    return successResponse(user)
  } catch (error) {
    console.error('Me error:', error)
    return errorResponse('Ошибка при получении данных пользователя', 500)
  }
}





