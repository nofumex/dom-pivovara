import { NextRequest } from 'next/server'
import { prisma, withRetry } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { errorResponse } from '@/lib/response'
import * as XLSX from 'xlsx'

// Увеличиваем максимальное время выполнения до 20 минут для больших файлов
export const maxDuration = 1200 // 20 минут в секундах
export const runtime = 'nodejs' // Используем nodejs runtime для длительных операций

/**
 * Функция для отправки прогресса через SSE
 */
function sendProgress(
  controller: ReadableStreamDefaultController,
  progress: number,
  message: string,
  details?: any,
) {
  const data = JSON.stringify({
    progress,
    message,
    ...details,
  })
  const encoder = new TextEncoder()
  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
}

/**
 * Нормализует название товара для сравнения
 * Более агрессивная нормализация для лучшего сопоставления
 */
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Множественные пробелы в один
    .replace(/[«»""'']/g, '"') // Нормализуем кавычки
    .replace(/[–—]/g, '-') // Нормализуем тире
    .replace(/[^\w\sа-яё\-]/gi, ' ') // Удаляем спецсимволы, оставляем только буквы, цифры, дефисы и пробелы
    .replace(/\s+/g, ' ') // Снова убираем множественные пробелы
    .trim()
}

/**
 * Удаляет общие префиксы и артикулы из названия
 */
function removeCommonPrefixes(name: string): string {
  // Удаляем префиксы типа "АВ ", "AV ", "АВ-", "AV-" в начале
  return name.replace(/^(ав|av)[\s\-]+/i, '').trim()
}

/**
 * Извлекает ключевые слова из названия (удаляет артикулы, вес, размеры)
 */
function extractKeywords(name: string): string {
  // Удаляем паттерны типа "100г", "100 г", "100гр", "70г", "87 г" и т.д.
  let cleaned = name.replace(/\d+\s*(г|гр|кг|ml|мл|л|шт|шт\.|pcs|pc)\b/gi, '')
  // Удаляем паттерны типа ", 70г", ", 100г" в конце
  cleaned = cleaned.replace(/,\s*\d+\s*(г|гр|кг|ml|мл|л|шт|шт\.|pcs|pc)\b/gi, '')
  // Удаляем паттерны типа "4 в 1", "3 в 1"
  cleaned = cleaned.replace(/\d+\s+в\s+\d+/gi, '')
  // Удаляем одиночные цифры в скобках
  cleaned = cleaned.replace(/\(\d+\)/g, '')
  // Удаляем лишние запятые и пробелы
  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim()
  return cleaned
}

/**
 * Вычисляет похожесть двух строк (улучшенный алгоритм)
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Если одна строка пустая
  if (!str1 || !str2) return 0
  
  // Точное совпадение
  if (str1 === str2) return 1.0
  
  // Разбиваем на слова
  const words1 = str1.split(/\s+/).filter(w => w.length > 1)
  const words2 = str2.split(/\s+/).filter(w => w.length > 1)
  
  if (words1.length === 0 || words2.length === 0) {
    // Если нет слов, сравниваем по символам
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    if (longer.includes(shorter) && shorter.length / longer.length > 0.7) {
      return 0.7
    }
    return 0
  }
  
  // Находим общие слова
  const commonWords = words1.filter(w => words2.includes(w))
  const allWords = new Set([...words1, ...words2])
  
  // Процент общих слов
  const wordSimilarity = commonWords.length / allWords.size
  
  // Проверяем порядок слов (если порядок совпадает, это лучше)
  let orderScore = 0
  if (commonWords.length > 0) {
    const order1 = words1.map(w => commonWords.indexOf(w)).filter(i => i >= 0)
    const order2 = words2.map(w => commonWords.indexOf(w)).filter(i => i >= 0)
    if (order1.length === order2.length) {
      const orderMatches = order1.filter((val, idx) => val === order2[idx]).length
      orderScore = orderMatches / order1.length * 0.2 // Бонус до 20%
    }
  }
  
  return Math.min(1.0, wordSimilarity + orderScore)
}

/**
 * Вычисляет расстояние Левенштейна (для fuzzy matching)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = []
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  
  return matrix[len1][len2]
}

/**
 * Вычисляет похожесть на основе расстояния Левенштейна
 */
function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1.0
  const distance = levenshteinDistance(str1, str2)
  return 1 - distance / maxLen
}

/**
 * Находит наиболее похожий товар по названию (многоуровневый поиск)
 */
function findBestMatch(
  productName: string,
  normalizedName: string,
  normalizedProductMap: Map<string, Array<{ id: string; title: string; sku: string; stock: number }>>,
  allProducts: Array<{ id: string; title: string; sku: string; stock: number }>,
): { id: string; title: string; sku: string; stock: number } | null {
  // 1. Точное совпадение по нормализованному названию
  const exactMatch = normalizedProductMap.get(normalizedName)
  if (exactMatch && exactMatch.length > 0) {
    return exactMatch[0]
  }

  // 2. Совпадение без общих префиксов
  const nameWithoutPrefix = removeCommonPrefixes(normalizedName)
  if (nameWithoutPrefix !== normalizedName) {
    for (const [normalizedTitle, products] of Array.from(normalizedProductMap.entries())) {
      const titleWithoutPrefix = removeCommonPrefixes(normalizedTitle)
      if (nameWithoutPrefix === titleWithoutPrefix) {
        return products[0]
      }
    }
  }

  // 3. Совпадение по ключевым словам (без веса, размеров и т.д.)
  const keywords1 = extractKeywords(normalizedName)
  if (keywords1 !== normalizedName && keywords1.length > 5) {
    for (const product of allProducts) {
      const normalizedProductTitle = normalizeProductName(product.title)
      const keywords2 = extractKeywords(normalizedProductTitle)
      if (keywords1 === keywords2) {
        return product
      }
    }
  }

  // 4. Частичное совпадение (одна строка содержит другую)
  for (const [normalizedTitle, products] of Array.from(normalizedProductMap.entries())) {
    if (normalizedTitle.includes(normalizedName) || normalizedName.includes(normalizedTitle)) {
      const lengthDiff = Math.abs(normalizedTitle.length - normalizedName.length)
      const avgLength = (normalizedTitle.length + normalizedName.length) / 2
      // Увеличиваем допустимую разницу до 60%
      if (avgLength > 0 && lengthDiff / avgLength < 0.6) {
        return products[0]
      }
    }
  }

  // 5. Поиск по похожести (общие слова) - снижаем порог до 40%
  let bestMatch: typeof allProducts[0] | null = null
  let bestSimilarity = 0.4 // Снижен порог до 40%

  for (const product of allProducts) {
    const normalizedProductTitle = normalizeProductName(product.title)
    const similarity = calculateSimilarity(normalizedName, normalizedProductTitle)
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity
      bestMatch = product
    }
  }

  // 6. Если не нашли по словам, пробуем fuzzy matching (Левенштейна)
  if (!bestMatch || bestSimilarity < 0.6) {
    let fuzzyBestMatch: typeof allProducts[0] | null = null
    let fuzzyBestSimilarity = 0.75 // Порог для fuzzy matching выше

    for (const product of allProducts) {
      const normalizedProductTitle = normalizeProductName(product.title)
      const fuzzySimilarity = calculateLevenshteinSimilarity(normalizedName, normalizedProductTitle)
      
      if (fuzzySimilarity > fuzzyBestSimilarity) {
        fuzzyBestSimilarity = fuzzySimilarity
        fuzzyBestMatch = product
      }
    }

    // Используем fuzzy match если он лучше
    if (fuzzyBestMatch && (!bestMatch || fuzzyBestSimilarity > bestSimilarity)) {
      return fuzzyBestMatch
    }
  }

  return bestMatch
}

/**
 * Вычисляет статус остатка на основе количества
 */
function calculateStockStatus(stock: number): 'MANY' | 'ENOUGH' | 'FEW' | 'NONE' {
  if (stock > 10) return 'MANY'
  if (stock > 0) return 'ENOUGH'
  if (stock === 0) return 'NONE'
  return 'FEW'
}

export async function POST(request: NextRequest) {
  console.log('[SYNC-STOCK] Начало синхронизации')

  // Создаем streaming response СРАЗУ, чтобы клиент мог подключиться
  // Проверку авторизации делаем внутри потока, чтобы ошибки отправлялись через SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      // Объявляем переменные keepalive вне try-catch, чтобы они были доступны в catch
      let keepAliveInterval: NodeJS.Timeout | null = null
      let longKeepAliveInterval: NodeJS.Timeout | null = null
      
      try {
        // Проверка авторизации внутри потока
        const user = await verifyRole(request, [UserRole.ADMIN])
        if (!user) {
          console.log('[SYNC-STOCK] Ошибка авторизации')
          const error = JSON.stringify({ error: 'Не авторизован', progress: 0 })
          controller.enqueue(encoder.encode(`data: ${error}\n\n`))
          controller.close()
          return
        }

        // Отправляем первый прогресс сразу после авторизации
        sendProgress(controller, 1, 'Инициализация синхронизации...')
        
        // Отправляем keepalive каждые 10 секунд в начале, затем каждые 30 секунд
        // Это помогает поддерживать соединение на ранних этапах
        let keepAliveCount = 0
        keepAliveInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': keepalive\n\n'))
            keepAliveCount++
            // После первых 3 keepalive (30 секунд) переключаемся на 30 секунд интервал
            if (keepAliveCount >= 3) {
              if (keepAliveInterval) clearInterval(keepAliveInterval)
              longKeepAliveInterval = setInterval(() => {
                try {
                  controller.enqueue(encoder.encode(': keepalive\n\n'))
                } catch (error) {
                  if (longKeepAliveInterval) clearInterval(longKeepAliveInterval)
                }
              }, 30000)
            }
          } catch (error) {
            // Соединение закрыто, очищаем интервал
            if (keepAliveInterval) clearInterval(keepAliveInterval)
            if (longKeepAliveInterval) clearInterval(longKeepAliveInterval)
          }
        }, 10000) // Каждые 10 секунд в начале

        console.log('[SYNC-STOCK] Пользователь авторизован, получение файла...')
        sendProgress(controller, 2, 'Получение файла...')
        
        const formData = await request.formData()
        const file = formData.get('file') as File
        const optionsStr = formData.get('options') as string | null
        
        // Парсим опции синхронизации
        let syncOptions = { setMissingToZero: false }
        if (optionsStr) {
          try {
            syncOptions = JSON.parse(optionsStr)
          } catch (e) {
            console.warn('[SYNC-STOCK] Ошибка парсинга опций, используем значения по умолчанию')
          }
        }

        if (!file) {
          const error = JSON.stringify({ error: 'Файл не предоставлен', progress: 0 })
          controller.enqueue(encoder.encode(`data: ${error}\n\n`))
          controller.close()
          return
        }

        // Проверяем формат файла
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
          const error = JSON.stringify({
            error: 'Поддерживаются только файлы Excel (.xlsx, .xls)',
            progress: 0,
          })
          controller.enqueue(encoder.encode(`data: ${error}\n\n`))
          controller.close()
          return
        }

        sendProgress(controller, 2, 'Чтение файла...')
        console.log(`[SYNC-STOCK] Начало синхронизации остатков из файла: ${file.name}`)

        // Чтение файла
        const buffer = Buffer.from(await file.arrayBuffer())
        let workbook: XLSX.WorkBook

        try {
          workbook = XLSX.read(buffer, {
            type: 'buffer',
            cellDates: false,
            cellNF: false,
            cellText: false,
          })
          console.log(`[SYNC-STOCK] ✓ Файл успешно прочитан`)
        } catch (error) {
          console.error('[SYNC-STOCK] ОШИБКА при чтении файла:', error)
          const errorData = JSON.stringify({
            error: `Ошибка при чтении файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
            progress: 0,
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
          return
        }

        sendProgress(controller, 5, 'Анализ структуры файла...')

        // Берем первый лист
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Преобразуем в JSON с заголовками
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: '',
        }) as any[][]

        if (rows.length === 0) {
          const errorData = JSON.stringify({ error: 'Файл пуст', progress: 0 })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
          return
        }

        sendProgress(controller, 8, 'Поиск заголовков...')

    // Ищем строку с заголовками "Номенклатура" и "Конечный остаток"
    let headerRowIndex = -1
    let nameColumnIndex = -1
    let stockColumnIndex = -1
    let dataStartRowIndex = -1

    // Ищем заголовки в первых 15 строках
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      // Ищем колонки с названием товара и остатком
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toLowerCase().trim()

        if (
          cell.includes('номенклатура') ||
          cell.includes('название') ||
          cell.includes('товар') ||
          cell.includes('наименование')
        ) {
          nameColumnIndex = j
        }

        if (
          cell.includes('конечный остаток') ||
          cell.includes('остаток') ||
          cell.includes('количество') ||
          cell.includes('кол-во') ||
          cell.includes('stock') ||
          cell.includes('qty')
        ) {
          stockColumnIndex = j
        }
      }

      // Если нашли заголовки, запоминаем строку
      if (nameColumnIndex >= 0 && stockColumnIndex >= 0 && headerRowIndex === -1) {
        headerRowIndex = i
      }

      // Ищем строку "Магазин" или "Склад" после заголовков - это начало данных
      if (headerRowIndex >= 0 && i > headerRowIndex) {
        const rowText = row.map((cell) => String(cell || '').toLowerCase().trim()).join(' ')
        if (rowText.includes('магазин') || rowText.includes('склад')) {
          dataStartRowIndex = i + 1 // Данные начинаются со следующей строки
          break
        }
      }
    }

    // Если не нашли строку "Магазин"/"Склад", начинаем со строки после заголовков
    if (dataStartRowIndex === -1 && headerRowIndex >= 0) {
      dataStartRowIndex = headerRowIndex + 1
    }

        if (headerRowIndex === -1 || nameColumnIndex === -1 || stockColumnIndex === -1) {
          const errorData = JSON.stringify({
            error: 'Не найдены необходимые колонки. Ожидаются колонки "Номенклатура" и "Конечный остаток"',
            progress: 0,
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
          return
        }

        if (dataStartRowIndex === -1) {
          const errorData = JSON.stringify({ error: 'Не найдена строка начала данных', progress: 0 })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
          return
        }

        console.log(
          `[SYNC-STOCK] Найдены колонки: Название (${nameColumnIndex}), Остаток (${stockColumnIndex}), строка заголовков: ${headerRowIndex}, начало данных: ${dataStartRowIndex}`,
        )

        sendProgress(controller, 10, 'Загрузка товаров из базы данных...')

        // Получаем все товары из БД для сопоставления
        const allProducts = await prisma.product.findMany({
          select: {
            id: true,
            title: true,
            sku: true,
            stock: true,
          },
        })

        sendProgress(controller, 15, 'Создание индекса товаров...')

        // Создаем Map для быстрого поиска товаров по нормализованному названию
        const productMap = new Map<string, typeof allProducts[0]>()
        const normalizedProductMap = new Map<string, typeof allProducts[0][]>()

        for (const product of allProducts) {
          const normalized = normalizeProductName(product.title)
          if (!normalizedProductMap.has(normalized)) {
            normalizedProductMap.set(normalized, [])
          }
          normalizedProductMap.get(normalized)!.push(product)
          productMap.set(product.id, product)
        }

        sendProgress(controller, 20, 'Обработка данных из файла...')

        // Обрабатываем данные из файла
        const fileProducts = new Map<string, number>() // Map<productId, stock>
        const updates: Array<{
          name: string
          stock: number
          success: boolean
          error?: string
          productTitle?: string
        }> = []
        let updatedCount = 0
        let notFoundCount = 0
        let errorCount = 0
        const matchedProducts: string[] = []
        const productsToUpdate: Array<{
          id: string
          stock: number
          isInStock: boolean
          stockStatus: 'MANY' | 'ENOUGH' | 'FEW' | 'NONE'
        }> = []

        const totalRows = rows.length - dataStartRowIndex
        let processedRows = 0

        // Начинаем с строки начала данных
        for (let i = dataStartRowIndex; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const productName = String(row[nameColumnIndex] || '').trim()
      const stockStr = String(row[stockColumnIndex] || '').trim()

      // Пропускаем пустые строки
      if (!productName) continue

      // Пропускаем строки, которые выглядят как заголовки или разделители
      const normalizedName = normalizeProductName(productName)
      if (
        normalizedName.includes('номенклатура') ||
        normalizedName.includes('склад') ||
        normalizedName.includes('итого') ||
        normalizedName.length < 2
      ) {
        continue
      }

      // Парсим остаток
      let stock = 0
      if (stockStr && stockStr.trim() !== '') {
        const parsed = parseFloat(stockStr.replace(/,/g, '.').replace(/\s/g, ''))
        if (!isNaN(parsed)) {
          stock = Math.max(0, Math.floor(parsed))
        }
      }

      // Ищем товар по названию с улучшенным алгоритмом
      const matchedProduct = findBestMatch(productName, normalizedName, normalizedProductMap, allProducts)
      
      if (matchedProduct) {
        const matchedNormalized = normalizeProductName(matchedProduct.title)
        // Логируем несовпадения названий для отладки (первые 20 для лучшей диагностики)
        if (matchedNormalized !== normalizedName && updatedCount < 20) {
          const similarity = calculateSimilarity(normalizedName, matchedNormalized)
          console.log(
            `[SYNC-STOCK] Найдено совпадение (${Math.round(similarity * 100)}%): "${productName}" → "${matchedProduct.title}"`,
          )
        }
      } else {
        // Логируем все не найденные товары для анализа
        console.log(
          `[SYNC-STOCK] Товар не найден: "${productName}" (нормализовано: "${normalizedName}")`,
        )
        
        // Пробуем найти похожие товары для подсказки
        const suggestions: string[] = []
        for (const product of allProducts.slice(0, 5)) {
          const normalizedProductTitle = normalizeProductName(product.title)
          const similarity = calculateSimilarity(normalizedName, normalizedProductTitle)
          if (similarity > 0.3) {
            suggestions.push(`${product.title} (${Math.round(similarity * 100)}%)`)
          }
        }
        if (suggestions.length > 0) {
          console.log(`[SYNC-STOCK] Возможные совпадения: ${suggestions.join(', ')}`)
        }
      }

          if (matchedProduct) {
            const stockStatus = calculateStockStatus(stock)

            // ВАЖНО: Добавляем товар в fileProducts ПЕРЕД добавлением в productsToUpdate
            // Это гарантирует, что товар не будет установлен в 0, даже если обновление не удастся
            fileProducts.set(matchedProduct.id, stock)

            // Добавляем в список для batch update
            productsToUpdate.push({
              id: matchedProduct.id,
              stock: stock,
              isInStock: stock > 0,
              stockStatus: stockStatus,
            })

            matchedProducts.push(matchedProduct.title)
            updatedCount++

            updates.push({
              name: productName,
              stock: stock,
              success: true,
              productTitle: matchedProduct.title,
            })
          } else {
            updates.push({
              name: productName,
              stock: stock,
              success: false,
              error: 'Товар не найден в каталоге',
            })
            notFoundCount++
          }

          processedRows++
          // Отправляем прогресс каждые 50 строк или каждые 5%
          if (processedRows % 50 === 0 || processedRows % Math.max(1, Math.floor(totalRows / 20)) === 0) {
            const progress = Math.min(70, 20 + Math.floor((processedRows / totalRows) * 50))
            sendProgress(controller, progress, `Обработано строк: ${processedRows} из ${totalRows}...`)
          }
        }

        sendProgress(controller, 70, 'Обновление товаров в базе данных...')

        // Удаляем дубликаты из productsToUpdate (если один товар найден несколько раз в файле)
        // Берем последнее значение для каждого товара
        const uniqueProductsToUpdate = new Map<string, typeof productsToUpdate[0]>()
        for (const product of productsToUpdate) {
          uniqueProductsToUpdate.set(product.id, product)
        }
        const deduplicatedProductsToUpdate = Array.from(uniqueProductsToUpdate.values())
        
        console.log(`[SYNC-STOCK] Всего товаров для обновления: ${productsToUpdate.length}, после дедупликации: ${deduplicatedProductsToUpdate.length}`)

        // Batch update товаров из файла
        // Используем транзакции для уменьшения нагрузки на пул соединений
        const BATCH_SIZE = 10 // Уменьшаем размер батча
        const BATCH_DELAY = 500 // Увеличиваем задержку между батчами
        
        for (let i = 0; i < deduplicatedProductsToUpdate.length; i += BATCH_SIZE) {
          const batch = deduplicatedProductsToUpdate.slice(i, i + BATCH_SIZE)

          try {
            // Используем транзакцию для batch update - это более эффективно и не перегружает пул соединений
            await withRetry(async () => {
              await prisma.$transaction(
                batch.map((product) =>
                  prisma.product.update({
                    where: { id: product.id },
                    data: {
                      stock: product.stock,
                      isInStock: product.isInStock,
                      stockStatus: product.stockStatus,
                    },
                  })
                )
              )
            }, 3, 2000) // 3 попытки с задержкой 2 секунды

            // Отправляем прогресс
            const progress = Math.min(85, 70 + Math.floor((i / deduplicatedProductsToUpdate.length) * 15))
            sendProgress(controller, progress, `Обновлено товаров: ${Math.min(i + BATCH_SIZE, deduplicatedProductsToUpdate.length)} из ${deduplicatedProductsToUpdate.length}...`)
          } catch (error: any) {
            console.error(`[SYNC-STOCK] Ошибка при обновлении батча ${i}-${i + BATCH_SIZE}:`, error)
            
            // Если это ошибка подключения, пробуем переподключиться
            if (error.code === 'P1017' || error.message?.includes('Server has closed the connection')) {
              console.log('[SYNC-STOCK] Попытка переподключения к БД...')
              try {
                await prisma.$disconnect()
                await new Promise((resolve) => setTimeout(resolve, 2000))
                // Prisma автоматически переподключится при следующем запросе
              } catch (reconnectError) {
                console.error('[SYNC-STOCK] Ошибка при переподключении:', reconnectError)
              }
            }
            
            // Продолжаем обработку следующих батчей
          }
          
          // Задержка между батчами для снижения нагрузки на БД
          if (i + BATCH_SIZE < productsToUpdate.length) {
            await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY))
          }
        }

        // Устанавливаем остаток в 0 для товаров, которых нет в файле (только если опция включена)
        let setToZeroCount = 0
        const setToZeroProducts: string[] = []

        if (syncOptions.setMissingToZero) {
          sendProgress(controller, 85, 'Установка остатка в 0 для товаров, отсутствующих в файле...')

          // Фильтруем товары, которых НЕТ в fileProducts
          // fileProducts содержит ВСЕ товары, которые были найдены в файле (независимо от типа совпадения)
          const productsToSetZero = allProducts.filter((product) => !fileProducts.has(product.id))
          
          console.log(`[SYNC-STOCK] Всего товаров в БД: ${allProducts.length}, найдено в файле: ${fileProducts.size}, будет установлено в 0: ${productsToSetZero.length}`)
          
          // Batch update для установки остатка в 0
          const ZERO_BATCH_SIZE = 10 // Уменьшаем размер батча
          const ZERO_BATCH_DELAY = 500 // Увеличиваем задержку
          
          for (let i = 0; i < productsToSetZero.length; i += ZERO_BATCH_SIZE) {
            const batch = productsToSetZero.slice(i, i + ZERO_BATCH_SIZE)

            try {
              // Используем транзакцию для batch update
              await withRetry(async () => {
                await prisma.$transaction(
                  batch.map((product) =>
                    prisma.product.update({
                      where: { id: product.id },
                      data: {
                        stock: 0,
                        isInStock: false,
                        stockStatus: 'NONE',
                      },
                    })
                  )
                )
              }, 3, 2000) // 3 попытки с задержкой 2 секунды

              setToZeroCount += batch.length
              batch.forEach((product) => setToZeroProducts.push(product.title))

              // Отправляем прогресс
              const progress = Math.min(95, 85 + Math.floor((i / productsToSetZero.length) * 10))
              sendProgress(controller, progress, `Установлено в 0: ${Math.min(i + ZERO_BATCH_SIZE, productsToSetZero.length)} из ${productsToSetZero.length}...`)
            } catch (error: any) {
              console.error(`[SYNC-STOCK] Ошибка при установке остатка в 0 для батча ${i}-${i + ZERO_BATCH_SIZE}:`, error)
              
              // Если это ошибка подключения, пробуем переподключиться
              if (error.code === 'P1017' || error.message?.includes('Server has closed the connection')) {
                console.log('[SYNC-STOCK] Попытка переподключения к БД...')
                try {
                  await prisma.$disconnect()
                  await new Promise((resolve) => setTimeout(resolve, 2000))
                  // Prisma автоматически переподключится при следующем запросе
                } catch (reconnectError) {
                  console.error('[SYNC-STOCK] Ошибка при переподключении:', reconnectError)
                }
              }
              
              // Продолжаем обработку следующих батчей
            }
            
            // Задержка между батчами
            if (i + ZERO_BATCH_SIZE < productsToSetZero.length) {
              await new Promise((resolve) => setTimeout(resolve, ZERO_BATCH_DELAY))
            }
          }
        } else {
          // Если опция отключена, просто пропускаем этот шаг
          sendProgress(controller, 95, 'Пропуск установки в 0 (опция отключена)...')
        }

        const result = {
          totalInFile: updates.length,
          updated: updatedCount,
          setToZero: setToZeroCount,
          notFound: notFoundCount,
          errors: errorCount,
          matchedProducts: matchedProducts.slice(0, 50), // Первые 50 для отображения
          setToZeroProducts: setToZeroProducts.slice(0, 50), // Первые 50 для отображения
          updates: updates.slice(0, 100), // Возвращаем первые 100 для отображения
        }

        console.log(
          `[SYNC-STOCK] Синхронизация завершена: обновлено ${updatedCount}, установлено в 0: ${setToZeroCount}, не найдено: ${notFoundCount}, ошибок: ${errorCount}`,
        )

        // Очищаем keepalive перед закрытием
        if (keepAliveInterval) clearInterval(keepAliveInterval)
        if (longKeepAliveInterval) clearInterval(longKeepAliveInterval)
        
        sendProgress(controller, 100, 'Синхронизация завершена!', { result })
        const finalData = JSON.stringify({ success: true, data: result, progress: 100 })
        controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
        controller.close()
      } catch (error: any) {
        // Очищаем keepalive при ошибке
        // keepAliveInterval может быть не определен, если ошибка произошла до его создания
        try {
          clearInterval(keepAliveInterval)
          if (longKeepAliveInterval) clearInterval(longKeepAliveInterval)
        } catch (e) {
          // Игнорируем ошибки очистки
        }
        
        console.error('[SYNC-STOCK] Ошибка при синхронизации остатков:', error)
        
        // Обработка ошибок подключения к БД
        let errorMessage = error.message || 'Неизвестная ошибка'
        if (error.code === 'P1001' || error.message?.includes("Can't reach database") || error.message?.includes('5432')) {
          errorMessage = 'Ошибка подключения к базе данных. Убедитесь, что база данных запущена и доступна. Попробуйте повторить операцию через несколько секунд.'
        } else if (error.code?.startsWith('P')) {
          errorMessage = `Ошибка базы данных (${error.code}). Попробуйте повторить операцию позже.`
        } else if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
          errorMessage = 'Превышено время ожидания. Файл слишком большой или операция занимает слишком много времени. Попробуйте разбить файл на части или повторить позже.'
        } else if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          errorMessage = 'Операция была прервана. Возможно, соединение было разорвано. Попробуйте повторить операцию.'
        }
        
        const errorData = JSON.stringify({
          error: `Ошибка при синхронизации: ${errorMessage}`,
          progress: 0,
        })
        try {
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        } catch (closeError) {
          // Игнорируем ошибки при закрытии уже закрытого потока
          console.error('[SYNC-STOCK] Ошибка при закрытии потока:', closeError)
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
