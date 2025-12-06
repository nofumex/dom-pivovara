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

// Функция для отправки прогресса через SSE
function sendProgress(controller: ReadableStreamDefaultController, progress: number, message: string, details?: any) {
  const data = JSON.stringify({
    progress,
    message,
    ...details,
  })
  const encoder = new TextEncoder()
  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
}

interface ImportOptions {
  skipExisting?: boolean
  updateExisting?: boolean
  importMedia?: boolean
  replaceAll?: boolean // Полная замена каталога - удаляет все существующие категории и товары
}

export async function POST(request: NextRequest) {
  console.log('[IMPORT] Начало импорта')
  
  // Проверка авторизации
  const user = await verifyRole(request, [UserRole.ADMIN])
  if (!user) {
    console.log('[IMPORT] Ошибка авторизации')
    return errorResponse('Не авторизован', 401)
  }

  // Создаем streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      try {
        console.log('[IMPORT] Пользователь авторизован, получение файла...')
        const formData = await request.formData()
        const file = formData.get('file') as File
        const optionsJson = formData.get('options') as string

        if (!file) {
          const error = JSON.stringify({ error: 'Файл не предоставлен', progress: 0 })
          controller.enqueue(encoder.encode(`data: ${error}\n\n`))
          controller.close()
          return
        }

        const options: ImportOptions = optionsJson
          ? JSON.parse(optionsJson)
          : { skipExisting: false, updateExisting: true, importMedia: true, replaceAll: false }

        sendProgress(controller, 2, 'Чтение файла...')

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
            const error = JSON.stringify({ error: 'JSON файл не найден в архиве', progress: 0 })
            controller.enqueue(encoder.encode(`data: ${error}\n\n`))
            controller.close()
            return
          }

          rawData = JSON.parse(await dataFile.async('string'))
          sendProgress(controller, 5, 'Обработка архива...')

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
          const error = JSON.stringify({ error: 'Неподдерживаемый формат файла', progress: 0 })
          controller.enqueue(encoder.encode(`data: ${error}\n\n`))
          controller.close()
          return
        }

        sendProgress(controller, 8, 'Нормализация данных...')
        
        // Определяем формат и нормализуем данные
        const format = detectImportFormat(rawData)
        const data = normalizeImportData(rawData, imageIdMap)

        // Validate normalized schema
        if (!data.products || !Array.isArray(data.products)) {
          const error = JSON.stringify({ error: 'Неверный формат данных: отсутствует массив products', progress: 0 })
          controller.enqueue(encoder.encode(`data: ${error}\n\n`))
          controller.close()
          return
        }
        if (!data.categories || !Array.isArray(data.categories)) {
          const error = JSON.stringify({ error: 'Неверный формат данных: отсутствует массив categories', progress: 0 })
          controller.enqueue(encoder.encode(`data: ${error}\n\n`))
          controller.close()
          return
        }

        const totalItems = data.categories.length + data.products.length
        let processedItems = 0

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

        sendProgress(controller, 10, 'Подготовка к импорту...')

        // Если включен режим полной замены, удаляем все существующие данные
        if (options.replaceAll) {
          console.log(`[IMPORT] Режим полной замены: удаление всех существующих товаров и категорий`)
          sendProgress(controller, 10, 'Удаление существующих данных...')
          
          // Удаляем в правильном порядке из-за внешних ключей:
          // 1. OrderItem (ссылается на Product)
          // 2. ProductVariant (ссылается на Product)
          // 3. Product (ссылается на Category)
          // 4. Category
          
          const deletedOrderItemsCount = await prisma.orderItem.deleteMany({})
          console.log(`[IMPORT] Удалено позиций заказов: ${deletedOrderItemsCount.count}`)
          
          const deletedVariantsCount = await prisma.productVariant.deleteMany({})
          console.log(`[IMPORT] Удалено вариантов товаров: ${deletedVariantsCount.count}`)
          
          const deletedProductsCount = await prisma.product.deleteMany({})
          console.log(`[IMPORT] Удалено товаров: ${deletedProductsCount.count}`)
          
          const deletedCategoriesCount = await prisma.category.deleteMany({})
          console.log(`[IMPORT] Удалено категорий: ${deletedCategoriesCount.count}`)
          
          console.log(`[IMPORT] Очистка завершена, начинаем создание новой структуры каталога`)
        }

        // Import categories (two-pass: first create all, then update parentId)
        console.log(`[IMPORT] Начало импорта категорий (${data.categories.length} шт.)`)
        sendProgress(controller, 15, `Импорт категорий (0/${data.categories.length})...`)
    const categorySlugToId = new Map<string, string>() // Map<slug, id>
    
    // Sort categories: first create root categories (without parentId), then children
    const sortedCategories = [...(data.categories || [])].sort((a, b) => {
      // Root categories first (no parentId)
      if (!a.parentId && b.parentId) return -1
      if (a.parentId && !b.parentId) return 1
      return 0
    })
    
    console.log(`[IMPORT] Отсортировано категорий: ${sortedCategories.length}, корневых: ${sortedCategories.filter(c => !c.parentId).length}`)
    
        // First pass: create categories
        // В режиме replaceAll все категории создаются заново, иначе используем существующую логику
        for (let i = 0; i < sortedCategories.length; i++) {
          const categoryData = sortedCategories[i]
          try {
            // В режиме replaceAll всегда создаем новые категории
            if (options.replaceAll) {
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
              processedItems++
              if (result.processed.categories <= 5) {
                console.log(`[IMPORT] Создана категория: ${categoryData.slug} (${categoryData.name})`)
              }
            } else {
          // Существующая логика для режима обновления
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
              processedItems++
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
            processedItems++
            if (result.processed.categories <= 5) {
              console.log(`[IMPORT] Создана категория: ${categoryData.slug} (${categoryData.name})`)
            }
          }
          
          // Отправляем прогресс каждые 10 категорий или на последней
          if ((i + 1) % 10 === 0 || i === sortedCategories.length - 1) {
            const progress = Math.min(30, 15 + Math.floor((processedItems / totalItems) * 25))
            sendProgress(controller, progress, `Импорт категорий (${i + 1}/${sortedCategories.length})...`, {
              processedCategories: result.processed.categories,
              totalCategories: sortedCategories.length,
            })
          }
        } catch (error: any) {
          console.error(`[IMPORT] Ошибка при импорте категории ${categoryData.slug}:`, error)
          result.errors.push(`Ошибка при импорте категории ${categoryData.slug}: ${error.message}`)
        }
      }
      
      console.log(`[IMPORT] Категории обработаны. Создано/обновлено: ${result.processed.categories}, в маппинге: ${categorySlugToId.size}`)

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
    let productsWithoutCategory = 0
    let productsWithFallbackCategory = 0
    
    for (const productData of data.products || []) {
      try {
        // В режиме replaceAll все товары создаются заново
        if (options.replaceAll) {
          // Find category by slug
          let category = null
          if (productData.categoryObj?.slug) {
            category = await prisma.category.findUnique({
              where: { slug: productData.categoryObj.slug },
            })
            
            if (!category) {
              productsWithoutCategory++
              result.errors.push(`Категория "${productData.categoryObj.slug}" не найдена для товара ${productData.sku}`)
              continue
            }
          } else {
            productsWithoutCategory++
            result.errors.push(`Категория не указана для товара ${productData.sku}`)
            continue
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
          processedItems++
          
          // Отправляем прогресс каждые 50 товаров или на последнем
          if ((i + 1) % 50 === 0 || i === data.products.length - 1) {
            const progress = Math.min(90, 35 + Math.floor((processedItems / totalItems) * 55))
            sendProgress(controller, progress, `Импорт товаров (${i + 1}/${data.products.length})...`, {
              processedProducts: result.processed.products,
              totalProducts: data.products.length,
            })
          }
        } else {
          // Существующая логика для режима обновления
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
                
                if (!category && productsWithoutCategory < 5) {
                  console.warn(`[IMPORT] Товар ${productData.sku} (обновление): категория "${productData.categoryObj.slug}" не найдена в базе`)
                }
              } else {
                if (productsWithoutCategory < 5) {
                  console.warn(`[IMPORT] Товар ${productData.sku} (обновление): categoryObj не указан`)
                }
              }

              if (!category) {
                productsWithoutCategory++
                // Пробуем найти любую категорию как fallback
                const fallbackCategory = await prisma.category.findFirst({
                  orderBy: { createdAt: 'asc' },
                })
                
                if (fallbackCategory) {
                  productsWithFallbackCategory++
                  if (productsWithFallbackCategory <= 5) {
                    console.log(`[IMPORT] Товар ${productData.sku} (обновление): категория "${productData.categoryObj?.slug || productData.categoryObj?.name || 'не указана'}" не найдена, используется fallback категория "${fallbackCategory.name}"`)
                  }
                  result.warnings.push(`Товар ${productData.sku}: категория "${productData.categoryObj?.slug || productData.categoryObj?.name || 'не указана'}" не найдена, использована категория "${fallbackCategory.name}"`)
                  category = fallbackCategory
                } else {
                  result.errors.push(`Категория не найдена для товара ${productData.sku} (искали: ${productData.categoryObj?.slug || productData.categoryObj?.name || 'не указана'}). Нет категорий в базе для fallback.`)
                  continue
                }
              } else {
                if (productsWithoutCategory < 5) {
                  console.log(`[IMPORT] Товар ${productData.sku} (обновление): найдена категория "${category.name}" (${category.slug})`)
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
              processedItems++
              
              // Отправляем прогресс каждые 50 товаров
              if ((i + 1) % 50 === 0) {
                const progress = Math.min(90, 35 + Math.floor((processedItems / totalItems) * 55))
                sendProgress(controller, progress, `Импорт товаров (${i + 1}/${data.products.length})...`, {
                  processedProducts: result.processed.products,
                  totalProducts: data.products.length,
                })
              }
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
              
              if (!category && productsWithoutCategory < 5) {
                console.warn(`[IMPORT] Товар ${productData.sku} (создание): категория "${productData.categoryObj.slug}" не найдена в базе`)
              }
            } else {
              if (productsWithoutCategory < 5) {
                console.warn(`[IMPORT] Товар ${productData.sku} (создание): categoryObj не указан`)
              }
            }

            if (!category) {
              productsWithoutCategory++
              // Пробуем найти любую категорию как fallback
              const fallbackCategory = await prisma.category.findFirst({
                orderBy: { createdAt: 'asc' },
              })
              
              if (fallbackCategory) {
                productsWithFallbackCategory++
                if (productsWithFallbackCategory <= 5) {
                  console.log(`[IMPORT] Товар ${productData.sku} (создание): категория "${productData.categoryObj?.slug || productData.categoryObj?.name || 'не указана'}" не найдена, используется fallback категория "${fallbackCategory.name}"`)
                }
                result.warnings.push(`Товар ${productData.sku}: категория "${productData.categoryObj?.slug || productData.categoryObj?.name || 'не указана'}" не найдена, использована категория "${fallbackCategory.name}"`)
                category = fallbackCategory
              } else {
                result.errors.push(`Категория не найдена для товара ${productData.sku} (искали: ${productData.categoryObj?.slug || productData.categoryObj?.name || 'не указана'}). Нет категорий в базе для fallback.`)
                continue
              }
            } else {
              if (productsWithoutCategory < 5) {
                console.log(`[IMPORT] Товар ${productData.sku} (создание): найдена категория "${category.name}" (${category.slug})`)
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
            processedItems++
            
            // Отправляем прогресс каждые 50 товаров или на последнем
            if ((i + 1) % 50 === 0 || i === data.products.length - 1) {
              const progress = Math.min(90, 35 + Math.floor((processedItems / totalItems) * 55))
              sendProgress(controller, progress, `Импорт товаров (${i + 1}/${data.products.length})...`, {
                processedProducts: result.processed.products,
                totalProducts: data.products.length,
              })
            }
          }
        } catch (error: any) {
          result.errors.push(`Ошибка при импорте товара ${productData.sku}: ${error.message}`)
        }
      }

      // Import settings
      sendProgress(controller, 92, 'Импорт настроек...')
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
        if (productsWithoutCategory > 0) {
          console.log(`[IMPORT] ВНИМАНИЕ: ${productsWithoutCategory} товаров не нашли категорию. Из них ${productsWithFallbackCategory} были привязаны к fallback категории.`)
        }
        
        sendProgress(controller, 100, 'Импорт завершен!', { result })
        const finalData = JSON.stringify({ success: true, data: result, progress: 100 })
        controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
        controller.close()
      } catch (error: any) {
        console.error('[IMPORT] Ошибка при импорте:', error)
        const errorData = JSON.stringify({ error: `Ошибка при импорте: ${error.message}`, progress: 0 })
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}








