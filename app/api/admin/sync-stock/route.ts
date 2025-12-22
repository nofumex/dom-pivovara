import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return errorResponse('Файл не предоставлен', 400)
    }

    // Проверка формата файла
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
      return errorResponse('Поддерживаются только файлы Excel (.xls, .xlsx)', 400)
    }

    // Чтение файла с опциями для старых форматов .xls
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log(`[SYNC] Размер файла: ${buffer.length} байт`)
    console.log(`[SYNC] Имя файла: ${file.name}`)
    
    let workbook
    try {
      workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellDates: false,
        cellNF: false,
        cellText: false,
        sheetStubs: true,
        // Дополнительные опции для старых форматов
        dense: false,
      })
      console.log(`[SYNC] ✓ Файл успешно прочитан библиотекой xlsx`)
    } catch (error) {
      console.error('[SYNC] ОШИБКА при чтении файла:', error)
      return errorResponse(
        `Ошибка при чтении файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        400,
      )
    }

    // Получаем первый лист
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      return errorResponse('Файл не содержит листов', 400)
    }

    const worksheet = workbook.Sheets[firstSheetName]

    // Читаем лист как массив строк, чтобы найти реальную строку заголовков
    // Используем defval: '' чтобы пустые ячейки были пустыми строками, а не undefined
    let rows: any[][]
    try {
      rows = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        raw: false,
        defval: '',
        blankrows: false,
      }) as any[][]
      console.log(`[SYNC] ✓ Данные извлечены из листа. Строк: ${rows.length}`)
    } catch (error) {
      console.error('[SYNC] ОШИБКА при извлечении данных из листа:', error)
      // Попробуем альтернативный метод
      try {
        rows = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          raw: true, // Попробуем raw: true
          defval: null,
        }) as any[][]
        console.log(`[SYNC] ✓ Данные извлечены альтернативным методом. Строк: ${rows.length}`)
      } catch (error2) {
        console.error('[SYNC] ОШИБКА при альтернативном извлечении:', error2)
        return errorResponse(
          `Ошибка при чтении данных из файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
          400,
        )
      }
    }
    
    // Преобразуем null/undefined в пустые строки для единообразия
    rows = rows.map(row => {
      if (!row) return []
      return row.map(cell => cell === null || cell === undefined ? '' : cell)
    })

    if (!rows || rows.length === 0) {
      console.error('[SYNC] ОШИБКА: Файл не содержит строк данных')
      return errorResponse('Файл не содержит данных', 400)
    }

    console.log(`[SYNC] ✓ Файл прочитан успешно. Всего строк: ${rows.length}`)
    console.log(`[SYNC] ✓ Первые 3 строки для проверки:`)
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      console.log(`[SYNC]   Строка ${i}: длина=${rows[i]?.length || 0}, данные=${JSON.stringify(rows[i]?.slice(0, 5) || [])}`)
    }

    // Функция для нормализации строки (для сравнения названий товаров)
    const normalizeString = (str: string | null | undefined): string => {
      if (!str) return ''
      return String(str)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\sа-яё]/gi, '') // Убираем спецсимволы для лучшего сравнения
    }

    // Функция для проверки, содержит ли строка одно из ключевых слов
    const containsKeyword = (str: string, keywords: string[]): boolean => {
      const normalized = normalizeString(str)
      return keywords.some(keyword => normalized.includes(keyword.toLowerCase()))
    }

    // Функция для поиска строки заголовков в формате "Остатки.xls"
    // Структура файла:
    // - Строка с "Номенклатура" (колонка 0) и "Конечный остаток" (колонка 5)
    // - Строка с "Магазин" (колонка 0) - после неё начинаются данные
    let headerRowIndex = -1
    let dataStartRowIndex = -1
    let productNameColIndex = 0 // Колонка с названием товара (обычно 0)
    let stockColIndex = 5 // Колонка с остатком (обычно 5)

    // Логируем первые строки для отладки
    console.log('[SYNC] Анализ структуры файла:')
    console.log(`[SYNC] Всего строк в файле: ${rows.length}`)
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const row = rows[i]
      if (row && row.length > 0) {
        const rowPreview = row.map((cell, idx) => {
          const cellStr = String(cell || '').trim()
          if (cellStr && idx < 8) return `[${idx}]"${cellStr.substring(0, 40)}"`
          return ''
        }).filter(Boolean).join(' ')
        console.log(`[SYNC] Строка ${i}: ${rowPreview}`)
      } else {
        console.log(`[SYNC] Строка ${i}: (пустая)`)
      }
    }

    // Ищем строку с заголовками "Номенклатура" и "Конечный остаток"
    // Варианты написания для гибкости
    const nomenclatureKeywords = ['номенклатура', 'наименование', 'название', 'товар', 'продукт', 'артикул']
    const stockKeywords = ['конечный остаток', 'остаток', 'количество', 'кол-во', 'колво', 'склад', 'наличие']
    const excludeStockKeywords = ['начальный остаток', 'входящий остаток', 'приход']

    for (let i = 0; i < Math.min(30, rows.length); i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      // Проверяем каждую ячейку отдельно
      let hasNomenclature = false
      let hasStock = false
      let nomenclatureIdx = -1
      let stockIdx = -1

      for (let j = 0; j < row.length; j++) {
        const cellStr = normalizeString(String(row[j] || ''))
        
        // Проверяем на номенклатуру
        if (!hasNomenclature && containsKeyword(cellStr, nomenclatureKeywords)) {
          hasNomenclature = true
          nomenclatureIdx = j
        }
        
        // Проверяем на остаток (но не начальный)
        if (!hasStock) {
          const isStock = containsKeyword(cellStr, stockKeywords)
          const isExcluded = containsKeyword(cellStr, excludeStockKeywords)
          if (isStock && !isExcluded) {
            hasStock = true
            stockIdx = j
          }
        }
      }

      if (hasNomenclature && hasStock) {
        headerRowIndex = i
        productNameColIndex = nomenclatureIdx
        stockColIndex = stockIdx
        console.log(`[SYNC] ✓ Найдена строка заголовков: строка ${i}`)
        console.log(`[SYNC] ✓ Колонка названия: ${productNameColIndex}, Колонка остатка: ${stockColIndex}`)
        break
      }
    }

    // Если не нашли заголовки вместе, пробуем найти по отдельности
    if (headerRowIndex === -1) {
      console.log('[SYNC] Заголовки не найдены вместе, ищем по отдельности...')
      for (let i = 0; i < Math.min(30, rows.length); i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        // Ищем "Номенклатура" (различные варианты)
        if (productNameColIndex === 0) {
          for (let j = 0; j < row.length; j++) {
            const cellStr = normalizeString(String(row[j] || ''))
            if (containsKeyword(cellStr, nomenclatureKeywords)) {
              productNameColIndex = j
              if (headerRowIndex === -1) headerRowIndex = i
              console.log(`[SYNC] Найдена колонка "Номенклатура": строка ${i}, колонка ${j}`)
              break
            }
          }
        }

        // Ищем "Конечный остаток" (различные варианты)
        if (stockColIndex === 5) {
          for (let j = 0; j < row.length; j++) {
            const cellStr = normalizeString(String(row[j] || ''))
            const isStock = containsKeyword(cellStr, stockKeywords)
            const isExcluded = containsKeyword(cellStr, excludeStockKeywords)
            if (isStock && !isExcluded) {
              stockColIndex = j
              if (headerRowIndex === -1) headerRowIndex = i
              console.log(`[SYNC] Найдена колонка "Остаток": строка ${i}, колонка ${j}`)
              break
            }
          }
        }

        if (headerRowIndex !== -1 && productNameColIndex !== 0 && stockColIndex !== 5) {
          break
        }
      }
    }

    if (headerRowIndex === -1) {
      // Попробуем альтернативный подход - найти любую строку с данными
      console.log('[SYNC] ⚠ Заголовки не найдены, пробуем альтернативный подход...')
      
      // Ищем первую строку, где есть текст в первой колонке и число в какой-то другой
      for (let i = 0; i < Math.min(50, rows.length); i++) {
        const row = rows[i]
        if (!row || row.length < 2) continue
        
        const firstCell = String(row[0] || '').trim()
        if (firstCell.length < 3) continue
        
        // Ищем колонку с числом (остаток)
        for (let j = 1; j < Math.min(row.length, 10); j++) {
          const cell = row[j]
          const cellStr = String(cell || '').trim().replace(/,/g, '.')
          const num = parseFloat(cellStr)
          
          if (!isNaN(num) && num >= 0 && num < 1000000) {
            // Похоже на данные
            headerRowIndex = i - 1 // Предыдущая строка может быть заголовком
            productNameColIndex = 0
            stockColIndex = j
            dataStartRowIndex = i // Данные начинаются с этой строки
            console.log(`[SYNC] ✓ Альтернативный поиск: найдена строка данных на строке ${i}, остаток в колонке ${j}`)
            break
          }
        }
        if (headerRowIndex !== -1) break
      }
      
      if (headerRowIndex === -1) {
        console.error('[SYNC] ОШИБКА: Не удалось найти заголовки или данные в файле')
        console.error('[SYNC] Структура файла:')
        for (let i = 0; i < Math.min(30, rows.length); i++) {
          const row = rows[i]
          if (row && row.length > 0) {
            console.error(`[SYNC]   Строка ${i}: ${JSON.stringify(row.slice(0, 6))}`)
          }
        }
        return errorResponse(
          'Не найдена строка с заголовками "Номенклатура" и "Конечный остаток". Проверьте формат файла. Подробности в логах сервера.',
          400,
        )
      }
    }

    // Ищем строку "Магазин" или "Склад" - после неё начинаются данные
    // Также ищем другие индикаторы начала данных
    const dataStartKeywords = ['магазин', 'склад', 'итого', 'всего', 'наименование', 'номенклатура']
    
    for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 10, rows.length); i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      // Проверяем первую ячейку и несколько следующих
      for (let col = 0; col < Math.min(3, row.length); col++) {
        const cellStr = normalizeString(String(row[col] || ''))
        if (containsKeyword(cellStr, dataStartKeywords)) {
          // Проверяем, что это не заголовок (не должно быть "остаток" в этой строке)
          const hasStockHeader = row.some((cell, idx) => {
            const cellStr2 = normalizeString(String(cell || ''))
            return containsKeyword(cellStr2, stockKeywords) && !containsKeyword(cellStr2, excludeStockKeywords)
          })
          
          if (!hasStockHeader) {
            dataStartRowIndex = i + 1 // Данные начинаются со следующей строки
            console.log(`[SYNC] ✓ Найдена строка начала данных: строка ${dataStartRowIndex} (после "${String(row[col] || '')}")`)
            break
          }
        }
      }
      if (dataStartRowIndex !== -1) break
    }

    // Если не нашли индикатор начала данных, пробуем найти первую строку с данными
    if (dataStartRowIndex === -1 && headerRowIndex !== -1) {
      // Ищем первую строку после заголовков, где есть название товара и число (остаток)
      for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 15, rows.length); i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue
        
        const productName = String(row[productNameColIndex] || '').trim()
        const stockValue = row[stockColIndex]
        
        // Проверяем, что есть название товара (не пустое, не заголовок)
        if (productName && 
            productName.length > 2 && 
            !containsKeyword(productName, nomenclatureKeywords) &&
            !containsKeyword(productName, dataStartKeywords)) {
          // Проверяем, что остаток - это число (или может быть пустым)
          const stockStr = String(stockValue || '').trim()
          const isNumber = !stockStr || !isNaN(parseFloat(stockStr.replace(/,/g, '.')))
          
          if (isNumber) {
            dataStartRowIndex = i
            console.log(`[SYNC] Найдена первая строка с данными: строка ${dataStartRowIndex} ("${productName.substring(0, 30)}")`)
            break
          }
        }
      }
      
      // Если всё ещё не нашли, начинаем со строки после заголовков + 1
      if (dataStartRowIndex === -1) {
        dataStartRowIndex = headerRowIndex + 2
        console.log(`[SYNC] Строка начала данных не найдена автоматически, начинаем со строки ${dataStartRowIndex}`)
      }
    }

    if (dataStartRowIndex === -1 || dataStartRowIndex >= rows.length) {
      console.error('[SYNC] ОШИБКА: Не удалось определить начало данных')
      console.error(`[SYNC] headerRowIndex=${headerRowIndex}, dataStartRowIndex=${dataStartRowIndex}, rows.length=${rows.length}`)
      
      // Последняя попытка - начинаем сразу после заголовков
      if (headerRowIndex !== -1 && headerRowIndex + 1 < rows.length) {
        dataStartRowIndex = headerRowIndex + 1
        console.log(`[SYNC] ⚠ Используем fallback: начинаем данные со строки ${dataStartRowIndex}`)
      } else {
        return errorResponse(
          'Не удалось определить начало данных в файле. Ожидается структура: заголовки с "Номенклатура" и "Конечный остаток", затем строка "Магазин", затем данные. Подробности в логах сервера.',
          400,
        )
      }
    }

    console.log(`[SYNC] ✓ Начало обработки данных со строки ${dataStartRowIndex}`)
    console.log(`[SYNC] ✓ Колонка названия товара: ${productNameColIndex}, Колонка остатка: ${stockColIndex}`)

    // Создаем мапу остатков из файла (название товара -> остаток)
    // Суммируем остатки для одинаковых товаров (если есть дубликаты)
    const stockMap = new Map<string, number>()
    const processedProductNames = new Set<string>()
    let processedRows = 0
    let skippedRows = 0

    // Обрабатываем строки данных
    console.log(`[SYNC] Начало обработки данных со строки ${dataStartRowIndex}, колонки: название=${productNameColIndex}, остаток=${stockColIndex}`)
    
    for (let i = dataStartRowIndex; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) {
        skippedRows++
        continue
      }

      // Проверяем, что у нас есть достаточно колонок
      if (row.length <= Math.max(productNameColIndex, stockColIndex)) {
        if (processedRows < 5) {
          console.log(`[SYNC] Строка ${i}: недостаточно колонок (${row.length}), требуется минимум ${Math.max(productNameColIndex, stockColIndex) + 1}`)
        }
        skippedRows++
        continue
      }

      const productNameCell = row[productNameColIndex]
      const stockCell = row[stockColIndex]

      const productName = String(productNameCell ?? '').trim()
      
      // Пропускаем пустые строки и строки с заголовками/итогами
      if (!productName || productName.length < 2) {
        if (processedRows < 5 && skippedRows < 5) {
          console.log(`[SYNC] Строка ${i}: пропущена (пустое название)`)
        }
        skippedRows++
        continue
      }
      
      // Пропускаем строки, которые являются заголовками или итогами
      const normalizedProductName = normalizeString(productName)
      if (containsKeyword(normalizedProductName, nomenclatureKeywords) ||
          containsKeyword(normalizedProductName, dataStartKeywords) ||
          normalizedProductName.includes('итого') ||
          normalizedProductName.includes('всего') ||
          normalizedProductName === '') {
        if (processedRows < 5 && skippedRows < 5) {
          console.log(`[SYNC] Строка ${i}: пропущена (заголовок/итог: "${productName.substring(0, 30)}")`)
        }
        skippedRows++
        continue
      }

      // Преобразуем остаток в число
      let stock = 0
      if (stockCell !== null && stockCell !== undefined && stockCell !== '') {
        const stockStr = String(stockCell).trim()
        if (stockStr) {
          // Убираем пробелы и заменяем запятую на точку
          const cleaned = stockStr.replace(/\s+/g, '').replace(/,/g, '.')
          const parsed = parseFloat(cleaned)
          if (!isNaN(parsed)) {
            stock = Math.max(0, Math.floor(parsed))
          }
        }
      }

      // Суммируем остатки для одинаковых товаров
      const normalizedName = normalizeString(productName)
      const currentStock = stockMap.get(normalizedName) || 0
      stockMap.set(normalizedName, currentStock + stock)
      processedProductNames.add(normalizedName)
      processedRows++

      // Логируем первые несколько товаров для отладки
      if (processedRows <= 10) {
        console.log(`[SYNC] Товар ${processedRows}: "${productName.substring(0, 60)}" -> остаток: ${stock}`)
      }
    }

    console.log(`[SYNC] ✓ Обработано строк: ${processedRows}, пропущено: ${skippedRows}`)
    console.log(`[SYNC] ✓ Найдено уникальных товаров в файле: ${stockMap.size}`)
    
    if (stockMap.size === 0) {
      console.error('[SYNC] ОШИБКА: Не найдено ни одного товара в файле!')
      console.error(`[SYNC] Параметры парсинга:`)
      console.error(`[SYNC]   - headerRowIndex: ${headerRowIndex}`)
      console.error(`[SYNC]   - dataStartRowIndex: ${dataStartRowIndex}`)
      console.error(`[SYNC]   - productNameColIndex: ${productNameColIndex}`)
      console.error(`[SYNC]   - stockColIndex: ${stockColIndex}`)
      console.error(`[SYNC]   - processedRows: ${processedRows}`)
      console.error(`[SYNC]   - skippedRows: ${skippedRows}`)
      console.error(`[SYNC] Примеры строк данных (первые 10 после dataStartRowIndex):`)
      for (let i = dataStartRowIndex; i < Math.min(dataStartRowIndex + 10, rows.length); i++) {
        const row = rows[i]
        if (row) {
          const name = String(row[productNameColIndex] || '').trim()
          const stock = row[stockColIndex]
          console.error(`[SYNC]   Строка ${i}: name="${name.substring(0, 50)}", stock=${stock} (тип: ${typeof stock})`)
        }
      }
    }

    // Получаем все товары из базы с названиями
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        title: true,
        stock: true,
        isInStock: true,
      },
    })

    console.log(`[SYNC] ✓ Товаров в базе данных: ${allProducts.length}`)

    // Логируем примеры товаров из базы для отладки
    if (allProducts.length > 0) {
      console.log(`[SYNC] Примеры товаров из БД (первые 3):`)
      allProducts.slice(0, 3).forEach((p) => {
        console.log(`  - "${p.title}" (SKU: ${p.sku})`)
      })
    }

    // Создаем индекс для быстрого поиска товаров по названию
    const productIndexByTitle = new Map<string, typeof allProducts[0]>()
    const productIndexByNormalizedTitle = new Map<string, typeof allProducts[0]>()

    for (const product of allProducts) {
      const normalizedTitle = normalizeString(product.title)
      productIndexByTitle.set(product.title, product)
      productIndexByNormalizedTitle.set(normalizedTitle, product)
    }

    // Логируем примеры товаров из файла для отладки
    if (stockMap.size > 0) {
      console.log(`[SYNC] Примеры товаров из файла (первые 3):`)
      let count = 0
      for (const [name, stock] of stockMap.entries()) {
        if (count >= 3) break
        console.log(`  - "${name.substring(0, 60)}" -> остаток: ${stock}`)
        count++
      }
    }

    const stats = {
      updated: 0,
      setToZero: 0,
      notFound: 0,
      errors: [] as string[],
      matchedProducts: [] as string[],
    }

    // Set для отслеживания обновленных товаров по ID
    const updatedProductIds = new Set<string>()

    // Обновляем остатки для товаров из файла
    let matchAttempts = 0
    for (const [productName, stock] of stockMap.entries()) {
      matchAttempts++
      // Ищем товар по точному совпадению нормализованного названия
      let product = productIndexByNormalizedTitle.get(productName)

      // Если не нашли, пробуем частичное совпадение
      if (!product) {
        // Сначала пробуем найти товар, где название из файла содержит название из БД
        product = allProducts.find((p) => {
          const normalizedTitle = normalizeString(p.title)
          // Точное совпадение после нормализации
          if (normalizedTitle === productName) return true
          // Название из файла содержит название из БД (или наоборот)
          if (productName.length > 10 && normalizedTitle.length > 10) {
            const similarity = Math.min(productName.length, normalizedTitle.length) / Math.max(productName.length, normalizedTitle.length)
            if (similarity > 0.8) {
              return productName.includes(normalizedTitle) || normalizedTitle.includes(productName)
            }
          }
          return false
        })
      }

      if (product) {
        try {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              stock,
              isInStock: stock > 0,
              stockStatus:
                stock === 0
                  ? 'NONE'
                  : stock < 10
                    ? 'FEW'
                    : stock < 50
                      ? 'ENOUGH'
                      : 'MANY',
            },
          })
          stats.updated++
          updatedProductIds.add(product.id)
          if (stats.matchedProducts.length < 50) {
            stats.matchedProducts.push(`${product.title} (SKU: ${product.sku})`)
          }
          if (stats.updated <= 5) {
            console.log(`[SYNC] ✓ Обновлен: "${product.title}" -> остаток: ${stock}`)
          }
        } catch (error) {
          stats.errors.push(
            `Ошибка обновления товара "${productName}": ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      } else {
        stats.notFound++
        if (stats.notFound <= 5) {
          console.log(`[SYNC] ✗ Товар не найден в каталоге: "${productName.substring(0, 60)}"`)
        }
      }
    }

    console.log(`[SYNC] ✓ Обработано товаров из файла: ${matchAttempts}`)
    console.log(`[SYNC] ✓ Найдено и обновлено: ${stats.updated}, Не найдено: ${stats.notFound}`)

    // Устанавливаем остаток 0 для товаров, которых нет в файле
    console.log(`[SYNC] Установка остатка 0 для товаров, отсутствующих в файле...`)
    for (const product of allProducts) {
      if (!updatedProductIds.has(product.id)) {
        try {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              stock: 0,
              isInStock: false,
              stockStatus: 'NONE',
            },
          })
          stats.setToZero++
        } catch (error) {
          stats.errors.push(
            `Ошибка обновления товара ${product.sku}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }
    }
    console.log(`[SYNC] ✓ Установлено остаток 0 для ${stats.setToZero} товаров`)

    return successResponse({
      message: 'Синхронизация завершена',
      data: {
        totalInFile: stockMap.size,
        updated: stats.updated,
        setToZero: stats.setToZero,
        notFound: stats.notFound,
        errors: stats.errors,
        matchedProducts: stats.matchedProducts.slice(0, 50), // Первые 50 для отображения
      },
    })
  } catch (error) {
    console.error('Sync stock error:', error)
    return errorResponse(
      `Ошибка при синхронизации остатков: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      500
    )
  }
}

