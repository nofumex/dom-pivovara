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

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}









