import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return errorResponse('This endpoint is not implemented yet', 501)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return errorResponse('This endpoint is not implemented yet', 501)
}
