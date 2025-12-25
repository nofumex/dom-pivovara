import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaClientVersion?: string
}

// Версия схемы - измените это значение, чтобы принудительно пересоздать клиент
const PRISMA_CLIENT_VERSION = '2.0'

// Проверяем, нужно ли пересоздать клиент
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  if (globalForPrisma.prismaClientVersion !== PRISMA_CLIENT_VERSION) {
    // Старая версия клиента - отключаем и удаляем
    if (globalForPrisma.prisma) {
      try {
        globalForPrisma.prisma.$disconnect()
      } catch (e) {
        // Игнорируем ошибки отключения
      }
      globalForPrisma.prisma = undefined
    }
    globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Функция для retry операций с БД
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Если это ошибка подключения к БД, пробуем повторить
      if (
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P1017' || // Server has closed the connection
        error.message?.includes("Can't reach database") ||
        error.message?.includes('Server has closed the connection')
      ) {
        if (attempt < maxRetries) {
          console.warn(`Database connection error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay * attempt)) // Exponential backoff
          continue
        }
      }
      
      // Для других ошибок не повторяем
      throw error
    }
  }
  
  throw lastError
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}









