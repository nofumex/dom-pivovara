import { NextRequest } from 'next/server'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
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

      // Validate schema
      if (!data.schemaVersion) {
        errors.push('Отсутствует поле schemaVersion')
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

      return successResponse({
        valid: errors.length === 0,
        errors,
        warnings,
        stats: {
          products: data.products?.length || 0,
          categories: data.categories?.length || 0,
          settings: Object.keys(data.settings || {}).length,
        },
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

