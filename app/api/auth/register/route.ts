import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { generateAccessToken, generateRefreshToken, createSession } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'
import { successResponse, errorResponse } from '@/lib/response'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify reCAPTCHA if token is provided
    if (body.recaptchaToken) {
      const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY?.trim()
      if (!RECAPTCHA_SECRET_KEY) {
        console.error('[reCAPTCHA] Secret key not found in environment variables')
        return errorResponse('reCAPTCHA не настроена на сервере', 500)
      }
      const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${RECAPTCHA_SECRET_KEY}&response=${body.recaptchaToken}`,
      })
      const recaptchaData = await recaptchaResponse.json()
      console.log('[reCAPTCHA] Verification response:', { success: recaptchaData.success, errors: recaptchaData['error-codes'] })
      if (!recaptchaData.success) {
        const errorCodes = recaptchaData['error-codes'] || []
        if (errorCodes.includes('invalid-input-secret')) {
          return errorResponse('Неверный секретный ключ reCAPTCHA. Проверьте настройки в .env файле.', 400)
        }
        return errorResponse('Ошибка проверки reCAPTCHA. Пожалуйста, подтвердите, что вы не робот.', 400)
      }
    }
    
    const validated = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      return errorResponse('Пользователь с таким email уже существует', 409)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: validated.email,
        password: hashedPassword,
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone,
        company: validated.company,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        company: true,
      },
    })

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = generateRefreshToken({ userId: user.id })

    // Create session
    await createSession(user.id, refreshToken)

    // Set cookies
    const cookieStore = await cookies()
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    })

    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return successResponse(
      {
        user,
        accessToken,
        refreshToken,
      },
      'Регистрация успешна'
    )
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    console.error('Register error:', error)
    return errorResponse('Ошибка при регистрации', 500)
  }
}










