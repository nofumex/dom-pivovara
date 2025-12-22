import { NextRequest } from 'next/server'
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

    // Чтение файла
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log(`[ANALYZE] Размер файла: ${buffer.length} байт`)
    console.log(`[ANALYZE] Имя файла: ${file.name}`)

    let workbook
    try {
      workbook = XLSX.read(buffer, {
        type: 'buffer',
        cellDates: false,
        cellNF: false,
        cellText: false,
        sheetStubs: true,
        dense: false,
      })
      console.log(`[ANALYZE] ✓ Файл успешно прочитан`)
    } catch (error) {
      console.error('[ANALYZE] ОШИБКА при чтении файла:', error)
      return errorResponse(
        `Ошибка при чтении файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        400,
      )
    }

    // Получаем все листы
    const sheets = workbook.SheetNames
    console.log(`[ANALYZE] Листов в файле: ${sheets.length}`)
    console.log(`[ANALYZE] Названия листов: ${sheets.join(', ')}`)

    const analysis: any = {
      fileName: file.name,
      fileSize: buffer.length,
      sheets: [],
    }

    // Анализируем каждый лист
    for (const sheetName of sheets) {
      const worksheet = workbook.Sheets[sheetName]
      
      // Пробуем разные методы чтения
      let rows1: any[][]
      let rows2: any[][]
      
      try {
        rows1 = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: '',
          blankrows: false,
        }) as any[][]
      } catch (e) {
        rows1 = []
      }

      try {
        rows2 = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: true,
          defval: null,
        }) as any[][]
      } catch (e) {
        rows2 = []
      }

      const rows = rows1.length > 0 ? rows1 : rows2

      // Преобразуем null/undefined в пустые строки
      const cleanRows = rows.map((row) => {
        if (!row) return []
        return row.map((cell) => (cell === null || cell === undefined ? '' : String(cell)))
      })

      // Анализируем первые 50 строк
      const preview: any[] = []
      for (let i = 0; i < Math.min(50, cleanRows.length); i++) {
        const row = cleanRows[i]
        if (row && row.length > 0) {
          preview.push({
            rowIndex: i,
            length: row.length,
            cells: row.slice(0, 10).map((cell, idx) => ({
              colIndex: idx,
              value: String(cell || '').substring(0, 100),
              type: typeof cell,
            })),
          })
        }
      }

      // Ищем потенциальные заголовки
      const potentialHeaders: any[] = []
      for (let i = 0; i < Math.min(30, cleanRows.length); i++) {
        const row = cleanRows[i]
        if (!row || row.length === 0) continue

        const rowText = row.map((cell) => String(cell || '').toLowerCase()).join(' ')
        const hasNomenclature =
          rowText.includes('номенклатура') ||
          rowText.includes('наименование') ||
          rowText.includes('название') ||
          rowText.includes('товар')
        const hasStock =
          rowText.includes('остаток') ||
          rowText.includes('количество') ||
          rowText.includes('кол-во') ||
          rowText.includes('склад')

        if (hasNomenclature || hasStock) {
          potentialHeaders.push({
            rowIndex: i,
            hasNomenclature,
            hasStock,
            cells: row.slice(0, 10).map((cell, idx) => ({
              colIndex: idx,
              value: String(cell || '').substring(0, 50),
            })),
          })
        }
      }

      analysis.sheets.push({
        name: sheetName,
        totalRows: cleanRows.length,
        maxColumns: Math.max(...cleanRows.map((r) => r?.length || 0), 0),
        preview,
        potentialHeaders,
      })
    }

    return successResponse({
      message: 'Анализ файла завершен',
      data: analysis,
    })
  } catch (error) {
    console.error('Analyze excel error:', error)
    return errorResponse(
      `Ошибка при анализе файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      500,
    )
  }
}

