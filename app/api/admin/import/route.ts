import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
import { normalizeImportData, detectImportFormat } from '@/lib/import-transformers'
import { downloadImageFromUrl } from '@/lib/upload'
import JSZip from 'jszip'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

interface ImportOptions {
  skipExisting?: boolean
  updateExisting?: boolean
  importMedia?: boolean
}

export async function POST(request: NextRequest) {
  console.log('[IMPORT] Начало импорта')
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      console.log('[IMPORT] Ошибка авторизации')
      return errorResponse('Не авторизован', 401)
    }

    console.log('[IMPORT] Пользователь авторизован, получение файла...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const optionsJson = formData.get('options') as string

    if (!file) {
      return errorResponse('Файл не предоставлен', 400)
    }

    const options: ImportOptions = optionsJson
      ? JSON.parse(optionsJson)
      : { skipExisting: false, updateExisting: true, importMedia: true }

    let rawData: any
    const imageIdMap = new Map<string, string>() // Map<imageId, filePath>

    // Parse file
    if (file.name.endsWith('.zip')) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const zip = await JSZip.loadAsync(buffer)
      
      // Ищем файл данных (может быть data.json или export_catalog.json)
      let dataFile = zip.file('data.json') || zip.file('export_catalog.json')
      
      if (!dataFile) {
        // Пробуем найти любой JSON файл
        const jsonFiles = Object.keys(zip.files).filter(name => name.endsWith('.json'))
        if (jsonFiles.length > 0) {
          dataFile = zip.file(jsonFiles[0])
        }
      }

      if (!dataFile) {
        return errorResponse('JSON файл не найден в архиве', 400)
      }

      rawData = JSON.parse(await dataFile.async('string'))

      // Import media if needed
      if (options.importMedia && zip.folder('media')) {
        const uploadsDir = join(process.cwd(), 'public', 'uploads')
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true })
        }

        const mediaFolder = zip.folder('media')
        if (mediaFolder) {
          for (const [filename, file] of Object.entries(mediaFolder.files)) {
            if (!file.dir) {
              try {
                const fileBuffer = await file.async('nodebuffer')
                const filePath = join(uploadsDir, filename)
                await writeFile(filePath, fileBuffer)
                
                // Создаем маппинг для изображений (если имя файла совпадает с ID)
                const imageId = filename.replace(/\.[^/.]+$/, '') // убираем расширение
                imageIdMap.set(imageId, `/uploads/${filename}`)
              } catch (error) {
                console.error(`Error importing media file ${filename}:`, error)
              }
            }
          }
        }
      }
    } else if (file.name.endsWith('.json')) {
      const text = await file.text()
      rawData = JSON.parse(text)
    } else {
      return errorResponse('Неподдерживаемый формат файла', 400)
    }

    // Определяем формат и нормализуем данные
    const format = detectImportFormat(rawData)
    const data = normalizeImportData(rawData, imageIdMap)

    // Validate normalized schema
    if (!data.products || !Array.isArray(data.products)) {
      return errorResponse('Неверный формат данных: отсутствует массив products', 400)
    }
    if (!data.categories || !Array.isArray(data.categories)) {
      return errorResponse('Неверный формат данных: отсутствует массив categories', 400)
    }

    const result = {
      processed: {
        products: 0,
        categories: 0,
        media: 0,
      },
      errors: [] as string[],
      warnings: [] as string[],
      skipped: {
        products: [] as string[],
        categories: [] as string[],
        media: [] as string[],
      },
    }

    // Изображения используются по ссылкам без загрузки
    // Если нужно загружать изображения, раскомментируйте код ниже
    /*
    if (options.importMedia) {
      console.log(`[IMPORT] Начало загрузки изображений для ${data.products.length} товаров`)
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      // Обрабатываем изображения товаров
      let processedImages = 0
      for (const product of data.products) {
        if (product.images && Array.isArray(product.images)) {
          const downloadedImages: string[] = []
          for (const imageUrl of product.images) {
            if (typeof imageUrl === 'string') {
              // Если это URL (начинается с http:// или https://), загружаем изображение
              if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                try {
                  const downloadResult = await downloadImageFromUrl(imageUrl)
                  downloadedImages.push(downloadResult.url)
                  result.processed.media++
                  processedImages++
                  if (processedImages % 10 === 0) {
                    console.log(`[IMPORT] Загружено изображений: ${processedImages}`)
                  }
                } catch (error: any) {
                  result.warnings.push(`Не удалось загрузить изображение ${imageUrl}: ${error.message}`)
                  // Оставляем оригинальный URL как fallback
                  downloadedImages.push(imageUrl)
                }
              } else {
                // Если это локальный путь, оставляем как есть
                downloadedImages.push(imageUrl)
              }
            }
          }
          // Обновляем массив изображений товара
          product.images = downloadedImages
        }
      }
      console.log(`[IMPORT] Загрузка изображений завершена. Всего загружено: ${result.processed.media}`)
    }
    */
    console.log(`[IMPORT] Изображения используются по ссылкам без загрузки`)

    // Import categories (two-pass: first create all, then update parentId)
    console.log(`[IMPORT] Начало импорта категорий (${data.categories.length} шт.)`)
    const categorySlugToId = new Map<string, string>() // Map<slug, id>
    
    // Sort categories: first create root categories (without parentId), then children
    const sortedCategories = [...(data.categories || [])].sort((a, b) => {
      // Root categories first (no parentId)
      if (!a.parentId && b.parentId) return -1
      if (a.parentId && !b.parentId) return 1
      return 0
    })
    
    // First pass: create/update categories without parentId
    for (const categoryData of sortedCategories) {
      try {
        const existing = await prisma.category.findUnique({
          where: { slug: categoryData.slug },
        })

        if (existing) {
          categorySlugToId.set(categoryData.slug, existing.id)
          if (options.skipExisting) {
            result.skipped.categories.push(categoryData.slug)
            continue
          }
          if (options.updateExisting) {
            await prisma.category.update({
              where: { slug: categoryData.slug },
              data: {
                name: categoryData.name,
                description: categoryData.description,
                image: categoryData.image,
                isActive: categoryData.isActive ?? true,
                sortOrder: categoryData.sortOrder ?? 0,
                seoTitle: categoryData.seoTitle,
                seoDesc: categoryData.seoDesc,
                updatedAt: new Date(),
              },
            })
            result.processed.categories++
          }
        } else {
          const newCategory = await prisma.category.create({
            data: {
              id: randomUUID(),
              name: categoryData.name,
              slug: categoryData.slug,
              description: categoryData.description,
              image: categoryData.image,
              isActive: categoryData.isActive ?? true,
              sortOrder: categoryData.sortOrder ?? 0,
              seoTitle: categoryData.seoTitle,
              seoDesc: categoryData.seoDesc,
              updatedAt: new Date(),
            },
          })
          categorySlugToId.set(categoryData.slug, newCategory.id)
          result.processed.categories++
        }
      } catch (error: any) {
        result.errors.push(`Ошибка при импорте категории ${categoryData.slug}: ${error.message}`)
      }
    }

    // Second pass: update parentId relationships
    for (const categoryData of data.categories || []) {
      if (!categoryData.parentId) continue // Skip if no parent

      try {
        const categoryId = categorySlugToId.get(categoryData.slug)
        const parentId = categorySlugToId.get(categoryData.parentId)

        if (!categoryId) {
          result.warnings.push(`Категория ${categoryData.slug} не найдена для обновления parentId`)
          continue
        }

        if (!parentId) {
          result.warnings.push(`Родительская категория ${categoryData.parentId} не найдена для ${categoryData.slug}`)
          continue
        }

        await prisma.category.update({
          where: { id: categoryId },
          data: { parentId },
        })
      } catch (error: any) {
        result.warnings.push(`Ошибка при обновлении parentId для категории ${categoryData.slug}: ${error.message}`)
      }
    }

    // Import products
    console.log(`[IMPORT] Начало импорта товаров (${data.products.length} шт.)`)
    for (const productData of data.products || []) {
      try {
        const existing = await prisma.product.findUnique({
          where: { sku: productData.sku },
        })

        if (existing) {
          if (options.skipExisting) {
            result.skipped.products.push(productData.sku)
            continue
          }
          if (options.updateExisting) {
            // Find category
            let category = null
            if (productData.categoryObj?.slug) {
              category = await prisma.category.findFirst({
                where: {
                  OR: [
                    { slug: productData.categoryObj.slug },
                    { name: productData.categoryObj.name },
                  ],
                },
              })
            }

            if (!category) {
              // Пробуем найти любую категорию как fallback
              const fallbackCategory = await prisma.category.findFirst({
                orderBy: { createdAt: 'asc' },
              })
              
              if (fallbackCategory) {
                console.log(`[IMPORT] Товар ${productData.sku} (обновление): категория не найдена, используется fallback категория "${fallbackCategory.name}"`)
                result.warnings.push(`Товар ${productData.sku}: категория "${productData.categoryObj?.slug || productData.categoryObj?.name || 'не указана'}" не найдена, использована категория "${fallbackCategory.name}"`)
                category = fallbackCategory
              } else {
                result.errors.push(`Категория не найдена для товара ${productData.sku} (искали: ${productData.categoryObj?.slug || productData.categoryObj?.name || 'не указана'}). Нет категорий в базе для fallback.`)
                continue
              }
            }

            await prisma.product.update({
              where: { sku: productData.sku },
              data: {
                title: productData.title,
                slug: productData.slug,
                description: productData.description,
                content: productData.content,
                price: productData.price.toString(),
                oldPrice: productData.oldPrice?.toString(),
                stock: typeof productData.stock === 'string' ? parseInt(productData.stock, 10) || 0 : (typeof productData.stock === 'number' ? productData.stock : 0),
                minOrder: productData.minOrder ?? 1,
                weight: productData.weight?.toString(),
                dimensions: productData.dimensions,
                material: productData.material,
                tags: productData.tags || [],
                images: productData.images || [],
                isActive: productData.isActive ?? true,
                isFeatured: productData.isFeatured ?? false,
                isInStock: productData.isInStock ?? true,
                visibility: productData.visibility || 'VISIBLE',
                categoryId: category.id,
                seoTitle: productData.seoTitle,
                seoDesc: productData.seoDesc,
                metaTitle: productData.metaTitle,
                metaDesc: productData.metaDesc,
              },
            })

            // Import variants
            if (productData.variants) {
              for (const variantData of productData.variants) {
                await prisma.productVariant.upsert({
                  where: { sku: variantData.sku },
                  update: {
                    size: variantData.size,
                    color: variantData.color,
                    material: variantData.material,
                    price: variantData.price.toString(),
                    stock: variantData.stock,
                    imageUrl: variantData.imageUrl,
                    isActive: variantData.isActive ?? true,
                  },
                  create: {
                    productId: existing.id,
                    size: variantData.size,
                    color: variantData.color,
                    material: variantData.material,
                    price: variantData.price.toString(),
                    stock: variantData.stock,
                    sku: variantData.sku,
                    imageUrl: variantData.imageUrl,
                    isActive: variantData.isActive ?? true,
                  },
                })
              }
            }

            result.processed.products++
          }
        } else {
          // Find category
          let category = null
          if (productData.categoryObj?.slug) {
            category = await prisma.category.findFirst({
              where: {
                OR: [
                  { slug: productData.categoryObj.slug },
                  { name: productData.categoryObj.name },
                ],
              },
            })
          }

          if (!category) {
            // Пробуем найти любую категорию как fallback
            const fallbackCategory = await prisma.category.findFirst({
              orderBy: { createdAt: 'asc' },
            })
            
            if (fallbackCategory) {
              console.log(`[IMPORT] Товар ${productData.sku}: категория не найдена, используется fallback категория "${fallbackCategory.name}"`)
              result.warnings.push(`Товар ${productData.sku}: категория "${productData.categoryObj?.slug || productData.categoryObj?.name || 'не указана'}" не найдена, использована категория "${fallbackCategory.name}"`)
              category = fallbackCategory
            } else {
              result.errors.push(`Категория не найдена для товара ${productData.sku} (искали: ${productData.categoryObj?.slug || productData.categoryObj?.name || 'не указана'}). Нет категорий в базе для fallback.`)
              continue
            }
          }

          const product = await prisma.product.create({
            data: {
              id: randomUUID(),
              sku: productData.sku,
              title: productData.title,
              slug: productData.slug,
              description: productData.description,
              content: productData.content,
              price: productData.price.toString(),
              oldPrice: productData.oldPrice?.toString(),
              stock: typeof productData.stock === 'string' ? parseInt(productData.stock, 10) || 0 : (typeof productData.stock === 'number' ? productData.stock : 0),
              minOrder: productData.minOrder ?? 1,
              weight: productData.weight?.toString(),
              dimensions: productData.dimensions,
              material: productData.material,
              tags: productData.tags || [],
              images: productData.images || [],
              isActive: productData.isActive ?? true,
              isFeatured: productData.isFeatured ?? false,
              isInStock: productData.isInStock ?? true,
              visibility: productData.visibility || 'VISIBLE',
              categoryId: category.id,
              seoTitle: productData.seoTitle,
              seoDesc: productData.seoDesc,
              metaTitle: productData.metaTitle,
              metaDesc: productData.metaDesc,
              updatedAt: new Date(),
            },
          })

          // Import variants
          if (productData.variants) {
            for (const variantData of productData.variants) {
              await prisma.productVariant.create({
                data: {
                  productId: product.id,
                  size: variantData.size,
                  color: variantData.color,
                  material: variantData.material,
                  price: variantData.price.toString(),
                  stock: variantData.stock,
                  sku: variantData.sku,
                  imageUrl: variantData.imageUrl,
                  isActive: variantData.isActive ?? true,
                },
              })
            }
          }

          result.processed.products++
        }
      } catch (error: any) {
        result.errors.push(`Ошибка при импорте товара ${productData.sku}: ${error.message}`)
      }
    }

    // Import settings
    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        try {
          await prisma.setting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value), type: 'STRING' },
          })
        } catch (error: any) {
          result.warnings.push(`Ошибка при импорте настройки ${key}: ${error.message}`)
        }
      }
    }

    console.log(`[IMPORT] Импорт завершен успешно. Обработано: товаров=${result.processed.products}, категорий=${result.processed.categories}, медиа=${result.processed.media}`)
    return successResponse(result, 'Импорт завершен')
  } catch (error: any) {
    console.error('[IMPORT] Ошибка при импорте:', error)
    return errorResponse(`Ошибка при импорте: ${error.message}`, 500)
  }
}







