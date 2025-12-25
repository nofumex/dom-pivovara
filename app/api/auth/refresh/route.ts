import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyRefreshToken, validateSession, generateAccessToken, generateRefreshToken, createSession, deleteSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token' },
        { status: 401 }
      )
    }

    // Проверяем refresh token
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Проверяем сессию
    const isValidSession = await validateSession(refreshToken)
    if (!isValidSession) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isBlocked: true,
      },
    })

    if (!user || user.isBlocked) {
      return NextResponse.json(
        { success: false, error: 'User not found or blocked' },
        { status: 401 }
      )
    }

    // Генерируем новые токены
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const newRefreshToken = generateRefreshToken({ userId: user.id })

    // Удаляем старую сессию и создаем новую
    try {
      await deleteSession(refreshToken)
    } catch (error) {
      console.error('Error deleting old session:', error)
    }

    try {
      await createSession(user.id, newRefreshToken)
    } catch (error) {
      console.error('Error creating new session:', error)
      // Если ошибка уникального ограничения, пробуем найти существующую сессию
      const existingSession = await prisma.session.findFirst({
        where: { userId: user.id },
      })
      if (existingSession) {
        // Обновляем существующую сессию
        await prisma.session.update({
          where: { id: existingSession.id },
          data: {
            refreshToken: newRefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        })
      } else {
        throw error
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    })

    // Устанавливаем новые cookies в response
    // Используем secure только для HTTPS запросов, иначе cookies не будут работать по HTTP
    const isSecure = request.url.startsWith('https://') || process.env.NEXT_PUBLIC_FORCE_SECURE_COOKIES === 'true'
    
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    })

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error refreshing token:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
