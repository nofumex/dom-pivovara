import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { generateAccessToken, generateRefreshToken, createSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { errorResponse } from '@/lib/response'

export async function POST(request: NextRequest) {
  try {
    console.log('Login API: Starting login request')
    const body = await request.json()
    const validated = loginSchema.parse(body)
    console.log('Login API: Validated email:', validated.email)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (!user) {
      console.log('Login API: User not found')
      return errorResponse('Неверный email или пароль', 401)
    }

    // Check if user is blocked
    if (user.isBlocked) {
      console.log('Login API: User is blocked')
      return errorResponse('Аккаунт заблокирован', 403)
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validated.password, user.password)
    if (!isValidPassword) {
      console.log('Login API: Invalid password')
      return errorResponse('Неверный email или пароль', 401)
    }

    console.log('Login API: Password verified, generating tokens')

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = generateRefreshToken({ userId: user.id })

    // Create session
    await createSession(user.id, refreshToken)
    console.log('Login API: Session created')

    // Create response with data
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phone: user.phone,
          company: user.company,
        },
        accessToken,
        refreshToken,
      },
      message: 'Вход выполнен успешно',
    })

    // Set cookies in response
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    console.log('Login API: Cookies set, returning response')
    return response
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse('Ошибка валидации', 400, error.errors[0]?.message)
    }
    
    // Handle database connection errors
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database') || error.message?.includes('5432')) {
      console.error('Database connection error:', error)
      return errorResponse('Ошибка подключения к базе данных. Убедитесь, что база данных запущена и доступна.', 503)
    }
    
    // Handle Prisma errors
    if (error.code?.startsWith('P')) {
      console.error('Prisma error:', error)
      return errorResponse('Ошибка базы данных. Попробуйте позже.', 500)
    }
    
    console.error('Login error:', error)
    return errorResponse('Ошибка при входе. Попробуйте позже.', 500)
  }
}





