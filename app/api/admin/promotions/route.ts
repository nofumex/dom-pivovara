import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/response'

export async function GET(request: NextRequest) {
  return errorResponse('This endpoint is not implemented yet', 501)
}

export async function POST(request: NextRequest) {
  return errorResponse('This endpoint is not implemented yet', 501)
}
