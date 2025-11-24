import { NextRequest } from 'next/server'
import { verifyRefreshToken, validateSession, generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const refreshToken = body.refreshToken || request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return errorResponse('Refresh token не предоставлен', 401)
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return errorResponse('Недействительный refresh token', 401)
    }

    // Validate session
    const isValidSession = await validateSession(refreshToken)
    if (!isValidSession) {
      return errorResponse('Сессия истекла', 401)
    }

    // Get user to generate new tokens
    const { prisma } = await import('@/lib/db')
    const db = prisma
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isBlocked: true,
      },
    })

    if (!user || user.isBlocked) {
      return errorResponse('Пользователь не найден или заблокирован', 401)
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const newRefreshToken = generateRefreshToken({ userId: user.id })

    // Update session
    const authLib = await import('@/lib/auth')
    await authLib.deleteSession(refreshToken)
    await authLib.createSession(user.id, newRefreshToken)

    // Set cookies
    const cookieStore = await cookies()
    cookieStore.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    })

    cookieStore.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return successResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  } catch (error) {
    console.error('Refresh error:', error)
    return errorResponse('Ошибка при обновлении токена', 500)
  }
}

