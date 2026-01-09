import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/lib/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return errorResponse('Токен reCAPTCHA не предоставлен', 400)
    }

    const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY
    if (!RECAPTCHA_SECRET_KEY) {
      return errorResponse('reCAPTCHA не настроена на сервере', 500)
    }

    // Verify with Google reCAPTCHA
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    })

    const data = await response.json()

    if (data.success) {
      return successResponse({ verified: true }, 'reCAPTCHA проверена успешно')
    } else {
      return errorResponse('Ошибка проверки reCAPTCHA', 400)
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return errorResponse('Ошибка при проверке reCAPTCHA', 500)
  }
}

