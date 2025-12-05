import { NextRequest } from 'next/server'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { detectImportFormat } from '@/lib/import-transformers'
import JSZip from 'jszip'

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

    const errors: string[] = []
    const warnings: string[] = []

    // Check file type
    if (!file.name.endsWith('.zip') && !file.name.endsWith('.json')) {
      return errorResponse('Неподдерживаемый формат файла. Используйте ZIP или JSON', 400)
    }

    try {
      let data: any

      if (file.name.endsWith('.zip')) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const zip = await JSZip.loadAsync(buffer)
        const dataFile = zip.file('data.json')

        if (!dataFile) {
          errors.push('Файл data.json не найден в архиве')
          return successResponse({ valid: false, errors, warnings })
        }

        data = JSON.parse(await dataFile.async('string'))
      } else {
        const text = await file.text()
        data = JSON.parse(text)
      }

      // Определяем формат данных
      const format = detectImportFormat(data)

      // Validate schema based on format
      if (format === 'export_catalog') {
        // Валидация формата export_catalog.json
        if (!data.sections || !Array.isArray(data.sections)) {
          errors.push('Отсутствует или неверный формат массива sections')
        }

        if (!data.products || !Array.isArray(data.products)) {
          errors.push('Отсутствует или неверный формат массива products')
        }

        // Validate sections
        if (data.sections) {
          data.sections.forEach((section: any, index: number) => {
            if (!section.ID) {
              errors.push(`Раздел #${index + 1}: отсутствует ID`)
            }
            if (!section.NAME) {
              errors.push(`Раздел #${index + 1}: отсутствует название (NAME)`)
            }
            if (!section.CODE && !section.ID) {
              errors.push(`Раздел #${index + 1}: отсутствует CODE или ID`)
            }
            if (section.IBLOCK_SECTION_ID === undefined) {
              errors.push(`Раздел #${index + 1}: отсутствует IBLOCK_SECTION_ID`)
            }
          })
        }

        // Validate products
        if (data.products) {
          data.products.forEach((product: any, index: number) => {
            if (!product.ID) {
              errors.push(`Товар #${index + 1}: отсутствует ID`)
            }
            if (!product.NAME) {
              errors.push(`Товар #${index + 1}: отсутствует название (NAME)`)
            }
            if (!product.CODE && !product.ID) {
              errors.push(`Товар #${index + 1}: отсутствует CODE или ID`)
            }
            if (product.IBLOCK_SECTION_ID === undefined) {
              errors.push(`Товар #${index + 1}: отсутствует IBLOCK_SECTION_ID`)
            }
            // Проверяем наличие цены в PROPS
            if (product.PROPS && Array.isArray(product.PROPS)) {
              const priceProp = product.PROPS.find((p: any) => 
                p.IBLOCK_PROPERTY_ID === '45' || 
                p.IBLOCK_PROPERTY_ID === 'price' ||
                (p.VALUE_NUM !== undefined || p.VALUE !== undefined)
              )
              if (!priceProp) {
                warnings.push(`Товар #${index + 1}: не найдено свойство с ценой в PROPS`)
              }
            } else {
              warnings.push(`Товар #${index + 1}: отсутствует массив PROPS`)
            }
          })
        }
      } else {
        // Валидация стандартного формата
        if (!data.schemaVersion) {
          warnings.push('Отсутствует поле schemaVersion (необязательно)')
        }

        if (!data.products || !Array.isArray(data.products)) {
          errors.push('Отсутствует или неверный формат массива products')
        }

        if (!data.categories || !Array.isArray(data.categories)) {
          errors.push('Отсутствует или неверный формат массива categories')
        }

        // Validate products
        if (data.products) {
          data.products.forEach((product: any, index: number) => {
            if (!product.sku) {
              errors.push(`Товар #${index + 1}: отсутствует SKU`)
            }
            if (!product.title) {
              errors.push(`Товар #${index + 1}: отсутствует название`)
            }
            if (!product.slug) {
              errors.push(`Товар #${index + 1}: отсутствует slug`)
            }
            if (product.price === undefined || product.price === null) {
              errors.push(`Товар #${index + 1}: отсутствует цена`)
            }
          })
        }

        // Validate categories
        if (data.categories) {
          data.categories.forEach((category: any, index: number) => {
            if (!category.name) {
              errors.push(`Категория #${index + 1}: отсутствует название`)
            }
            if (!category.slug) {
              errors.push(`Категория #${index + 1}: отсутствует slug`)
            }
          })
        }
      }

      const format = detectImportFormat(data)
      const stats = {
        products: data.products?.length || 0,
        categories: format === 'export_catalog' 
          ? (data.sections?.length || 0)
          : (data.categories?.length || 0),
        sections: format === 'export_catalog' ? (data.sections?.length || 0) : 0,
        settings: Object.keys(data.settings || {}).length,
        format,
      }

      return successResponse({
        valid: errors.length === 0,
        errors,
        warnings,
        stats,
      })
    } catch (error: any) {
      if (error.message.includes('JSON')) {
        errors.push('Ошибка парсинга JSON: ' + error.message)
      } else if (error.message.includes('ZIP')) {
        errors.push('Ошибка чтения ZIP архива: ' + error.message)
      } else {
        errors.push('Ошибка валидации: ' + error.message)
      }

      return successResponse({ valid: false, errors, warnings })
    }
  } catch (error: any) {
    console.error('Validate file error:', error)
    return errorResponse('Ошибка при валидации файла', 500)
  }
}







