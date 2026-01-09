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

// Оптимизация для работы с удаленной БД (российский сервер -> иностранная БД)
// Увеличиваем таймауты и настраиваем connection pool
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL || ''
  
  if (!baseUrl) {
    console.warn('[DB] DATABASE_URL не установлен')
    return baseUrl
  }
  
  // Если URL уже содержит параметры, добавляем к ним, иначе добавляем новые
  const urlParts = baseUrl.split('?')
  const baseUrlWithoutParams = urlParts[0]
  const existingParams = urlParts[1] || ''
  
  const params = new URLSearchParams(existingParams)
  
  // Увеличиваем таймауты для международных соединений
  // connect_timeout - время ожидания подключения (секунды) - для PostgreSQL
  // statement_timeout - максимальное время выполнения запроса (миллисекунды) - для PostgreSQL
  if (!params.has('connect_timeout')) {
    params.set('connect_timeout', '30') // 30 секунд на подключение
  }
  if (!params.has('statement_timeout')) {
    params.set('statement_timeout', '60000') // 60 секунд на выполнение запроса (в миллисекундах)
  }
  
  // Для Neon pooler рекомендуется использовать pgbouncer=true
  // и connection_limit для ограничения соединений
  if (baseUrl.includes('pooler') && !params.has('pgbouncer')) {
    params.set('pgbouncer', 'true')
  }
  
  // Ограничиваем количество соединений в пуле для избежания таймаутов
  if (!params.has('connection_limit')) {
    params.set('connection_limit', '10') // Максимум 10 соединений в пуле
  }
  
  // Увеличиваем таймаут получения соединения из пула
  if (!params.has('pool_timeout')) {
    params.set('pool_timeout', '20') // 20 секунд на получение соединения
  }
  
  const newUrl = `${baseUrlWithoutParams}?${params.toString()}`
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB] Database URL configured with extended timeouts for international connections')
  }
  return newUrl
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] // Убираем 'query' чтобы уменьшить нагрузку
      : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

// Функция для retry операций с БД
// Оптимизирована для работы с удаленной БД (российский сервер -> иностранная БД)
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5, // Увеличиваем количество попыток для международных соединений
  delay: number = 2000 // Увеличиваем начальную задержку
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now()
      const result = await operation()
      const duration = Date.now() - startTime
      
      // Логируем медленные запросы (более 5 секунд) для диагностики
      if (duration > 5000) {
        console.warn(`[DB] Slow query detected: ${duration}ms`)
      }
      
      return result
    } catch (error: any) {
      lastError = error
      
      // Если это ошибка подключения к БД, пробуем повторить
      const isConnectionError = 
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P1017' || // Server has closed the connection
        error.code === 'P1008' || // Operations timed out
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET' ||
        error.message?.includes("Can't reach database") ||
        error.message?.includes('Server has closed the connection') ||
        error.message?.includes('timeout') ||
        error.message?.includes('TIMEOUT') ||
        error.message?.includes('Connection') ||
        error.message?.includes('connection')
      
      if (isConnectionError) {
        if (attempt < maxRetries) {
          // Exponential backoff с jitter для избежания thundering herd
          const backoffDelay = delay * Math.pow(2, attempt - 1) + Math.random() * 1000
          console.warn(
            `[DB] Connection error (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(backoffDelay)}ms...`,
            error.code || error.message
          )
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
          
          // Пробуем переподключиться
          try {
            await prisma.$disconnect()
            await new Promise(resolve => setTimeout(resolve, 1000))
            // Prisma автоматически переподключится при следующем запросе
          } catch (disconnectError) {
            // Игнорируем ошибки отключения
          }
          
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









