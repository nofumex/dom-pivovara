import { cookies } from 'next/headers'
import { getAuthUserFromCookies, verifyRefreshToken, validateSession } from './auth'
import { prisma } from './db'

export async function getAuthUserWithRefresh(): Promise<{
  user: Awaited<ReturnType<typeof getAuthUserFromCookies>> | null
  needsRefresh: boolean
}> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  const refreshToken = cookieStore.get('refreshToken')?.value

  // Если есть accessToken, проверяем его
  if (accessToken) {
    const user = await getAuthUserFromCookies(accessToken)
    if (user) {
      return { user, needsRefresh: false }
    }
  }

  // Если accessToken нет или невалиден, пробуем обновить через refreshToken
  // Но НЕ устанавливаем cookies здесь - это делается через API route
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken)
      if (payload) {
        const isValidSession = await validateSession(refreshToken)
        if (isValidSession) {
          // Получаем пользователя
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              phone: true,
              company: true,
              isBlocked: true,
            },
          })

          if (user && !user.isBlocked) {
            // Возвращаем пользователя с флагом needsRefresh
            // Обновление токенов будет происходить через API route
            return {
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phone: user.phone,
                company: user.company,
              },
              needsRefresh: true,
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
    }
  }

  return { user: null, needsRefresh: false }
}
