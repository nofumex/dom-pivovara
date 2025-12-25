import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import * as XLSX from 'xlsx'

// Импортируем функции из sync-stock
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[«»""'']/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^\w\sа-яё\-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function removeCommonPrefixes(name: string): string {
  return name.replace(/^(ав|av)[\s\-]+/i, '').trim()
}

function extractKeywords(name: string): string {
  let cleaned = name.replace(/\d+\s*(г|гр|кг|ml|мл|л|шт|шт\.|pcs|pc)\b/gi, '')
  cleaned = cleaned.replace(/,\s*\d+\s*(г|гр|кг|ml|мл|л|шт|шт\.|pcs|pc)\b/gi, '')
  cleaned = cleaned.replace(/\d+\s+в\s+\d+/gi, '')
  cleaned = cleaned.replace(/\(\d+\)/g, '')
  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim()
  return cleaned
}

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  if (str1 === str2) return 1.0
  
  const words1 = str1.split(/\s+/).filter(w => w.length > 1)
  const words2 = str2.split(/\s+/).filter(w => w.length > 1)
  
  if (words1.length === 0 || words2.length === 0) {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    if (longer.includes(shorter) && shorter.length / longer.length > 0.7) {
      return 0.7
    }
    return 0
  }
  
  const commonWords = words1.filter(w => words2.includes(w))
  const allWords = new Set([...words1, ...words2])
  const wordSimilarity = commonWords.length / allWords.size
  
  let orderScore = 0
  if (commonWords.length > 0) {
    const order1 = words1.map(w => commonWords.indexOf(w)).filter(i => i >= 0)
    const order2 = words2.map(w => commonWords.indexOf(w)).filter(i => i >= 0)
    if (order1.length === order2.length) {
      const orderMatches = order1.filter((val, idx) => val === order2[idx]).length
      orderScore = orderMatches / order1.length * 0.2
    }
  }
  
  return Math.min(1.0, wordSimilarity + orderScore)
}

function findBestMatch(
  productName: string,
  normalizedName: string,
  normalizedProductMap: Map<string, Array<{ id: string; title: string; sku: string; stock: number }>>,
  allProducts: Array<{ id: string; title: string; sku: string; stock: number }>,
): { id: string; title: string; sku: string; stock: number; matchType: string; similarity?: number } | null {
  // 1. Точное совпадение
  const exactMatch = normalizedProductMap.get(normalizedName)
  if (exactMatch && exactMatch.length > 0) {
    return { ...exactMatch[0], matchType: 'exact' }
  }

  // 2. Без префиксов
  const nameWithoutPrefix = removeCommonPrefixes(normalizedName)
  if (nameWithoutPrefix !== normalizedName) {
    for (const [normalizedTitle, products] of Array.from(normalizedProductMap.entries())) {
      const titleWithoutPrefix = removeCommonPrefixes(normalizedTitle)
      if (nameWithoutPrefix === titleWithoutPrefix) {
        return { ...products[0], matchType: 'prefix_removed' }
      }
    }
  }

  // 3. По ключевым словам
  const keywords1 = extractKeywords(normalizedName)
  if (keywords1 !== normalizedName && keywords1.length > 5) {
    for (const product of allProducts) {
      const normalizedProductTitle = normalizeProductName(product.title)
      const keywords2 = extractKeywords(normalizedProductTitle)
      if (keywords1 === keywords2) {
        return { ...product, matchType: 'keywords' }
      }
    }
  }

  // 4. Частичное совпадение
  for (const [normalizedTitle, products] of Array.from(normalizedProductMap.entries())) {
    if (normalizedTitle.includes(normalizedName) || normalizedName.includes(normalizedTitle)) {
      const lengthDiff = Math.abs(normalizedTitle.length - normalizedName.length)
      const avgLength = (normalizedTitle.length + normalizedName.length) / 2
      if (avgLength > 0 && lengthDiff / avgLength < 0.6) {
        return { ...products[0], matchType: 'partial' }
      }
    }
  }

  // 5. По похожести
  let bestMatch: typeof allProducts[0] | null = null
  let bestSimilarity = 0.4

  for (const product of allProducts) {
    const normalizedProductTitle = normalizeProductName(product.title)
    const similarity = calculateSimilarity(normalizedName, normalizedProductTitle)
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity
      bestMatch = product
    }
  }

  if (bestMatch) {
    return { ...bestMatch, matchType: 'similarity', similarity: bestSimilarity }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return errorResponse('Файл не предоставлен', 400)
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return errorResponse('Поддерживаются только файлы Excel (.xlsx, .xls)', 400)
    }

    console.log(`[ANALYZE-STOCK] Начало анализа файла: ${file.name}`)

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
    } catch (error) {
      return errorResponse(
        `Ошибка при чтении файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        400,
      )
    }

    // Берем первый лист
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: '',
    }) as any[][]

    if (rows.length === 0) {
      return errorResponse('Файл пуст', 400)
    }

    // Ищем заголовки
    let headerRowIndex = -1
    let nameColumnIndex = -1
    let stockColumnIndex = -1
    let dataStartRowIndex = -1

    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

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

      if (nameColumnIndex >= 0 && stockColumnIndex >= 0 && headerRowIndex === -1) {
        headerRowIndex = i
      }

      if (headerRowIndex >= 0 && i > headerRowIndex) {
        const rowText = row.map((cell) => String(cell || '').toLowerCase().trim()).join(' ')
        if (rowText.includes('магазин') || rowText.includes('склад')) {
          dataStartRowIndex = i + 1
          break
        }
      }
    }

    if (dataStartRowIndex === -1 && headerRowIndex >= 0) {
      dataStartRowIndex = headerRowIndex + 1
    }

    if (headerRowIndex === -1 || nameColumnIndex === -1 || stockColumnIndex === -1) {
      return errorResponse(
        'Не найдены необходимые колонки. Ожидаются колонки "Номенклатура" и "Конечный остаток"',
        400,
      )
    }

    // Получаем все товары из БД
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        sku: true,
        stock: true,
      },
    })

    // Создаем индексы
    const normalizedProductMap = new Map<string, Array<{ id: string; title: string; sku: string; stock: number }>>()

    for (const product of allProducts) {
      const normalized = normalizeProductName(product.title)
      if (!normalizedProductMap.has(normalized)) {
        normalizedProductMap.set(normalized, [])
      }
      normalizedProductMap.get(normalized)!.push(product)
    }

    // Анализируем данные из файла
    const matches: Array<{
      fileProduct: string
      matchedProduct: string
      matchedSku: string
      stock: number
      matchType: string
      similarity?: number
    }> = []

    const notFound: Array<{
      fileProduct: string
      suggestions: Array<{ title: string; similarity: number }>
    }> = []

    const totalRows = rows.length - dataStartRowIndex
    let processedRows = 0

    for (let i = dataStartRowIndex; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const productName = String(row[nameColumnIndex] || '').trim()
      const stockStr = String(row[stockColumnIndex] || '').trim()

      if (!productName) continue

      const normalizedName = normalizeProductName(productName)
      if (
        normalizedName.includes('номенклатура') ||
        normalizedName.includes('склад') ||
        normalizedName.includes('итого') ||
        normalizedName.length < 2
      ) {
        continue
      }

      let stock = 0
      if (stockStr && stockStr.trim() !== '') {
        const parsed = parseFloat(stockStr.replace(/,/g, '.').replace(/\s/g, ''))
        if (!isNaN(parsed)) {
          stock = Math.max(0, Math.floor(parsed))
        }
      }

      const match = findBestMatch(productName, normalizedName, normalizedProductMap, allProducts)

      if (match) {
        matches.push({
          fileProduct: productName,
          matchedProduct: match.title,
          matchedSku: match.sku,
          stock: stock,
          matchType: match.matchType,
          similarity: match.similarity,
        })
      } else {
        // Находим возможные совпадения для подсказок
        const suggestions: Array<{ title: string; similarity: number }> = []
        for (const product of allProducts) {
          const normalizedProductTitle = normalizeProductName(product.title)
          const similarity = calculateSimilarity(normalizedName, normalizedProductTitle)
          if (similarity > 0.3) {
            suggestions.push({ title: product.title, similarity })
          }
        }
        suggestions.sort((a, b) => b.similarity - a.similarity)
        
        notFound.push({
          fileProduct: productName,
          suggestions: suggestions.slice(0, 3), // Топ-3 совпадения
        })
      }

      processedRows++
    }

    // Статистика
    const stats = {
      totalInFile: matches.length + notFound.length,
      found: matches.length,
      notFound: notFound.length,
      foundPercent: ((matches.length / (matches.length + notFound.length)) * 100).toFixed(1),
      matchTypes: {
        exact: matches.filter(m => m.matchType === 'exact').length,
        prefix_removed: matches.filter(m => m.matchType === 'prefix_removed').length,
        keywords: matches.filter(m => m.matchType === 'keywords').length,
        partial: matches.filter(m => m.matchType === 'partial').length,
        similarity: matches.filter(m => m.matchType === 'similarity').length,
      },
    }

    return successResponse({
      stats,
      matches: matches.slice(0, 100), // Первые 100 для отображения
      notFound: notFound.slice(0, 200), // Первые 200 не найденных
      totalMatches: matches.length,
      totalNotFound: notFound.length,
    })
  } catch (error) {
    console.error('[ANALYZE-STOCK] Ошибка при анализе:', error)
    return errorResponse(
      `Ошибка при анализе: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      500,
    )
  }
}

