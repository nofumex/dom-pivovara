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
    
    // Приоритетные ключевые слова для точного поиска "конечный остаток"
    const finalStockKeywords = ['конечный остаток', 'конечныйостаток']

    // Сначала ищем строку, где есть оба заголовка вместе
    // Важно: ищем точные совпадения, чтобы избежать ложных срабатываний в описательных текстах
    for (let i = 0; i < Math.min(30, rows.length); i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      let hasNomenclature = false
      let hasStock = false
      let nomenclatureIdx = -1
      let stockIdx = -1

      // Проверяем каждую ячейку отдельно
      for (let j = 0; j < row.length; j++) {
        const cellValue = String(row[j] || '').trim()
        const cellLower = cellValue.toLowerCase().trim()
        
        // Проверяем на номенклатуру - ищем ТОЧНОЕ совпадение
        if (!hasNomenclature) {
          // Точное совпадение "номенклатура" (без нормализации, просто toLowerCase)
          if (cellLower === 'номенклатура') {
            hasNomenclature = true
            nomenclatureIdx = j
          }
        }
        
        // Проверяем на остаток - приоритет "конечный остаток" с ТОЧНЫМ совпадением
        if (!hasStock) {
          // Точное совпадение "конечный остаток"
          if (cellLower === 'конечный остаток') {
            hasStock = true
            stockIdx = j
          } else {
            // Другие варианты только если это не исключенные ключевые слова
            const isExcluded = excludeStockKeywords.some(kw => cellLower.includes(kw.toLowerCase()))
            if (!isExcluded) {
              // Точное совпадение других ключевых слов
              if (cellLower === 'остаток' || 
                  cellLower === 'количество' || 
                  cellLower === 'кол-во' || 
                  cellLower === 'наличие') {
                hasStock = true
                stockIdx = j
              }
            }
          }
        }
      }

      if (hasNomenclature && hasStock && nomenclatureIdx !== stockIdx) {
        headerRowIndex = i
        productNameColIndex = nomenclatureIdx
        stockColIndex = stockIdx
        console.log(`[SYNC] ✓ Найдена строка заголовков: строка ${i}`)
        console.log(`[SYNC] ✓ Колонка названия: ${productNameColIndex} = "${String(row[productNameColIndex])}"`)
        console.log(`[SYNC] ✓ Колонка остатка: ${stockColIndex} = "${String(row[stockColIndex])}"`)
        break
      }
    }

    // Если не нашли заголовки вместе, пробуем найти по отдельности в близких строках
    if (headerRowIndex === -1) {
      console.log('[SYNC] Заголовки не найдены вместе, ищем по отдельности...')
      
      let foundNomenclatureRow = -1
      let foundStockRow = -1
      
      // Ищем "Номенклатура" и "Конечный остаток" в разных строках, но близко друг к другу
      for (let i = 0; i < Math.min(30, rows.length); i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        // Ищем "Номенклатура" - точное совпадение
        if (foundNomenclatureRow === -1) {
          for (let j = 0; j < row.length; j++) {
            const cellValue = String(row[j] || '').trim()
            const cellLower = cellValue.toLowerCase().trim()
            
            if (cellLower === 'номенклатура') {
              productNameColIndex = j
              foundNomenclatureRow = i
              console.log(`[SYNC] Найдена колонка "Номенклатура": строка ${i}, колонка ${j} = "${cellValue}"`)
              break
            }
          }
        }

        // Ищем "Конечный остаток" с приоритетом точного совпадения
        if (foundStockRow === -1) {
          for (let j = 0; j < row.length; j++) {
            const cellValue = String(row[j] || '').trim()
            const cellLower = cellValue.toLowerCase().trim()
            
            // Точное совпадение "конечный остаток"
            if (cellLower === 'конечный остаток') {
              stockColIndex = j
              foundStockRow = i
              console.log(`[SYNC] Найдена колонка "Конечный остаток": строка ${i}, колонка ${j} = "${cellValue}"`)
              break
            }
            
            // Или другие варианты, но только точные совпадения
            const isExcluded = excludeStockKeywords.some(kw => cellLower.includes(kw.toLowerCase()))
            if (!isExcluded) {
              if (cellLower === 'остаток' || 
                  cellLower === 'количество' || 
                  cellLower === 'кол-во' || 
                  cellLower === 'наличие') {
                stockColIndex = j
                foundStockRow = i
                console.log(`[SYNC] Найдена колонка "Остаток": строка ${i}, колонка ${j} = "${cellValue}"`)
                break
              }
            }
          }
        }

        // Если нашли оба заголовка (даже в разных строках, но близко)
        if (foundNomenclatureRow !== -1 && foundStockRow !== -1) {
          // Используем более позднюю строку как заголовок
          headerRowIndex = Math.max(foundNomenclatureRow, foundStockRow)
          console.log(`[SYNC] ✓ Заголовки найдены в строках ${foundNomenclatureRow} и ${foundStockRow}, используем строку ${headerRowIndex}`)
          break
        }
      }
      
      // Если нашли только один из заголовков, используем его
      if (headerRowIndex === -1 && foundNomenclatureRow !== -1) {
        headerRowIndex = foundNomenclatureRow
        console.log(`[SYNC] Найдена только "Номенклатура", используем строку ${headerRowIndex}`)
      } else if (headerRowIndex === -1 && foundStockRow !== -1) {
        headerRowIndex = foundStockRow
        console.log(`[SYNC] Найдена только "Остаток", используем строку ${headerRowIndex}`)
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
    const dataStartKeywords = ['магазин', 'склад', 'итого', 'всего']
    
    // Ищем строку с "Магазин" или "Склад" сразу после заголовков
    // Это индикатор начала данных
    for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 10, rows.length); i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      // Проверяем первую ячейку (обычно "Магазин" или "Склад" находится в первой колонке)
      const firstCellValue = String(row[0] || '').trim()
      const firstCellLower = firstCellValue.toLowerCase().trim()
      
      // Точная проверка на "магазин" или "склад" (без нормализации, чтобы избежать проблем)
      if (firstCellLower === 'магазин' || firstCellLower === 'склад') {
        // Проверяем, что это не заголовок (не должно быть "остаток" или "номенклатура" в этой строке)
        let hasHeaderKeywords = false
        for (const cell of row) {
          const cellValue = String(cell || '').trim()
          const cellLower = cellValue.toLowerCase().trim()
          
          // Проверяем точные совпадения заголовков
          if (cellLower === 'номенклатура' ||
              cellLower === 'конечный остаток' ||
              cellLower === 'остаток' ||
              cellLower === 'количество' ||
              cellLower.includes('ед. изм') ||
              cellLower.includes('ед изм')) {
            hasHeaderKeywords = true
            break
          }
        }
        
        if (!hasHeaderKeywords) {
          dataStartRowIndex = i + 1 // Данные начинаются со следующей строки
          console.log(`[SYNC] ✓ Найдена строка начала данных: строка ${dataStartRowIndex} (после "${firstCellValue}")`)
          break
        }
      }
    }

    // Если не нашли индикатор начала данных, пробуем найти первую строку с данными
    if (dataStartRowIndex === -1 && headerRowIndex !== -1) {
      console.log('[SYNC] Индикатор "Магазин" не найден, ищем первую строку с данными...')
      
      // Ищем первую строку после заголовков, где есть название товара и число (остаток)
      for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 15, rows.length); i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue
        
        // Проверяем, что у нас достаточно колонок
        if (row.length <= Math.max(productNameColIndex, stockColIndex)) continue
        
        const productName = String(row[productNameColIndex] || '').trim()
        const stockValue = row[stockColIndex]
        
        // Пропускаем строки с индикаторами начала (Магазин, Склад) и заголовками
        const firstCellValue = String(row[0] || '').trim()
        const firstCellLower = firstCellValue.toLowerCase().trim()
        if (firstCellLower === 'магазин' || firstCellLower === 'склад' || 
            firstCellLower === 'итого' || firstCellLower === 'всего') {
          continue
        }
        
        // Проверяем, что есть название товара (не пустое, не заголовок, достаточно длинное)
        const productNameLower = productName.toLowerCase().trim()
        if (productName && 
            productName.length > 2 && 
            productNameLower !== 'номенклатура' &&
            productNameLower !== 'магазин' &&
            productNameLower !== 'склад' &&
            productNameLower !== 'наименование' &&
            productNameLower !== 'название' &&
            productNameLower !== 'товар' &&
            !productNameLower.startsWith('итого') &&
            !productNameLower.startsWith('всего')) {
          
          // Проверяем, что остаток - это число (или может быть пустым)
          const stockStr = String(stockValue || '').trim().replace(/,/g, '.')
          const stockNum = parseFloat(stockStr)
          const isNumber = !stockStr || (!isNaN(stockNum) && stockNum >= 0)
          
          if (isNumber) {
            dataStartRowIndex = i
            console.log(`[SYNC] ✓ Найдена первая строка с данными: строка ${dataStartRowIndex} ("${productName.substring(0, 50)}", остаток: ${stockValue})`)
            break
          }
        }
      }
      
      // Если всё ещё не нашли, начинаем со строки после заголовков + 2 (пропускаем строку "Магазин")
      if (dataStartRowIndex === -1) {
        dataStartRowIndex = headerRowIndex + 2
        console.log(`[SYNC] ⚠ Строка начала данных не найдена автоматически, начинаем со строки ${dataStartRowIndex}`)
      }
    }

    // Критическая проверка: убеждаемся, что dataStartRowIndex установлен корректно
    if (dataStartRowIndex === -1 || dataStartRowIndex >= rows.length) {
      console.error('[SYNC] ОШИБКА: Не удалось определить начало данных')
      console.error(`[SYNC] headerRowIndex=${headerRowIndex}, dataStartRowIndex=${dataStartRowIndex}, rows.length=${rows.length}`)
      
      // Последняя попытка - начинаем сразу после заголовков
      if (headerRowIndex !== -1 && headerRowIndex + 1 < rows.length) {
        dataStartRowIndex = headerRowIndex + 2 // Используем +2, чтобы пропустить строку "Магазин"
        console.log(`[SYNC] ⚠ Используем fallback: начинаем данные со строки ${dataStartRowIndex}`)
      } else {
        console.error('[SYNC] КРИТИЧЕСКАЯ ОШИБКА: Не удалось определить начало данных, возвращаем ошибку')
        return errorResponse(
          'Не удалось определить начало данных в файле. Ожидается структура: заголовки с "Номенклатура" и "Конечный остаток", затем строка "Магазин", затем данные. Подробности в логах сервера.',
          400,
        )
      }
    }
    
    // Дополнительная проверка корректности индексов
    if (headerRowIndex === -1) {
      console.error('[SYNC] КРИТИЧЕСКАЯ ОШИБКА: headerRowIndex не установлен!')
      return errorResponse(
        'Не удалось найти заголовки в файле. Проверьте формат файла.',
        400,
      )
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
    console.log(`[SYNC] ===== НАЧАЛО ОБРАБОТКИ ДАННЫХ =====`)
    console.log(`[SYNC] Начало обработки данных со строки ${dataStartRowIndex}, колонки: название=${productNameColIndex}, остаток=${stockColIndex}`)
    console.log(`[SYNC] Всего строк для обработки: ${rows.length - dataStartRowIndex}`)
    
    // Проверяем первые несколько строк перед обработкой
    console.log(`[SYNC] Проверка первых 5 строк данных перед обработкой:`)
    for (let checkI = dataStartRowIndex; checkI < Math.min(dataStartRowIndex + 5, rows.length); checkI++) {
      const checkRow = rows[checkI]
      if (checkRow && checkRow.length > 0) {
        const checkName = String(checkRow[productNameColIndex] || '').trim()
        const checkStock = checkRow[stockColIndex]
        console.log(`[SYNC]   Строка ${checkI}: name="${checkName.substring(0, 50)}", stock=${checkStock}`)
      }
    }
    console.log(`[SYNC] ====================================`)
    
    for (let i = dataStartRowIndex; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) {
        skippedRows++
        // Если встретили несколько пустых строк подряд, возможно, данные закончились
        if (processedRows > 0 && skippedRows > 5) {
          console.log(`[SYNC] Обнаружено много пустых строк подряд, возможно, данные закончились на строке ${i}`)
          // Продолжаем, но логируем это
        }
        continue
      }
      
      // Проверяем, не достигли ли мы конца данных (строка "Итого" или подобное)
      const firstCellStr = String(row[0] || '').trim().toLowerCase()
      if (firstCellStr === 'итого' || firstCellStr === 'всего' || firstCellStr === 'конец' || firstCellStr.startsWith('итого')) {
        console.log(`[SYNC] Обнаружена строка "Итого" на строке ${i}, останавливаем обработку данных`)
        break
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
      const productNameLower = productName.toLowerCase().trim()
      // Проверяем только точные совпадения и конкретные паттерны, чтобы не фильтровать реальные товары
      if (productNameLower === 'номенклатура' ||
          productNameLower === 'магазин' ||
          productNameLower === 'склад' ||
          productNameLower === 'наименование' ||
          productNameLower === 'название' ||
          productNameLower === 'товар' ||
          productNameLower.startsWith('итого') ||
          productNameLower.startsWith('всего') ||
          productNameLower === '') {
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
        if (stockStr && stockStr !== '-' && stockStr.toLowerCase() !== 'н' && stockStr.toLowerCase() !== 'нет') {
          // Убираем пробелы, заменяем запятую на точку, убираем нечисловые символы (кроме точки и минуса)
          const cleaned = stockStr
            .replace(/\s+/g, '')
            .replace(/,/g, '.')
            .replace(/[^\d.-]/g, '')
          const parsed = parseFloat(cleaned)
          if (!isNaN(parsed) && isFinite(parsed)) {
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
      console.error(`[SYNC] Примеры строк данных (первые 20 после dataStartRowIndex):`)
      for (let i = dataStartRowIndex; i < Math.min(dataStartRowIndex + 20, rows.length); i++) {
        const row = rows[i]
        if (row) {
          const name = String(row[productNameColIndex] || '').trim()
          const stock = row[stockColIndex]
          const nameLower = name.toLowerCase().trim()
          const isFiltered = nameLower === 'номенклатура' ||
            nameLower === 'магазин' ||
            nameLower === 'склад' ||
            nameLower === 'наименование' ||
            nameLower === 'название' ||
            nameLower === 'товар' ||
            nameLower.startsWith('итого') ||
            nameLower.startsWith('всего')
          console.error(`[SYNC]   Строка ${i}: name="${name.substring(0, 50)}", stock=${stock} (тип: ${typeof stock}), filtered=${isFiltered}`)
        }
      }
      // Не возвращаем ошибку, продолжаем с пустым результатом
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
      for (const [name, stock] of Array.from(stockMap.entries())) {
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
    for (const [productName, stock] of Array.from(stockMap.entries())) {
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
    
    // Финальная проверка результата
    console.log(`[SYNC] ===== ФИНАЛЬНЫЙ РЕЗУЛЬТАТ =====`)
    console.log(`[SYNC] totalInFile (stockMap.size): ${stockMap.size}`)
    console.log(`[SYNC] updated: ${stats.updated}`)
    console.log(`[SYNC] setToZero: ${stats.setToZero}`)
    console.log(`[SYNC] notFound: ${stats.notFound}`)
    console.log(`[SYNC] ===============================`)

    return successResponse(
      {
        totalInFile: stockMap.size,
        updated: stats.updated,
        setToZero: stats.setToZero,
        notFound: stats.notFound,
        errors: stats.errors,
        matchedProducts: stats.matchedProducts.slice(0, 50), // Первые 50 для отображения
      },
      'Синхронизация завершена',
    )
  } catch (error) {
    console.error('Sync stock error:', error)
    return errorResponse(
      `Ошибка при синхронизации остатков: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      500
    )
  }
}

