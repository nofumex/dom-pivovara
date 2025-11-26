import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from './db'
import { UserRole } from '@prisma/client'

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
}

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string | null
  company?: string | null
}

export function generateAccessToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not defined')
  }
  return jwt.sign(payload, secret, { expiresIn: '15m' })
}

export function generateRefreshToken(payload: { userId: string }): string {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined')
  }
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return null
    }
    return jwt.verify(token, secret) as JWTPayload
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const secret = process.env.JWT_REFRESH_SECRET
    if (!secret) {
      return null
    }
    return jwt.verify(token, secret) as { userId: string }
  } catch {
    return null
  }
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('accessToken')?.value

    if (!token) {
      return null
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      return null
    }

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

    if (!user || user.isBlocked) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      company: user.company,
    }
  } catch {
    return null
  }
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  return getAuthUser(request)
}

export async function verifyRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<AuthUser | null> {
  const user = await getAuthUser(request)
  if (!user) {
    return null
  }

  if (!allowedRoles.includes(user.role)) {
    return null
  }

  return user
}

export async function createSession(userId: string, refreshToken: string): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  await prisma.session.create({
    data: {
      userId,
      refreshToken,
      expiresAt,
    },
  })
}

export async function deleteSession(refreshToken: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { refreshToken },
  })
}

export async function validateSession(refreshToken: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
  })

  if (!session) {
    return false
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } })
    return false
  }

  return true
}

// Функция для работы с аутентификацией в Server Components (App Router)
export async function getAuthUserFromCookies(token: string | undefined): Promise<AuthUser | null> {
  try {
    if (!token) {
      return null
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      return null
    }

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

    if (!user || user.isBlocked) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      company: user.company,
    }
  } catch {
    return null
  }
}

