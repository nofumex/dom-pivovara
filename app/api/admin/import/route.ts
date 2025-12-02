import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/response'
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
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const optionsJson = formData.get('options') as string

    if (!file) {
      return errorResponse('Файл не предоставлен', 400)
    }

    const options: ImportOptions = optionsJson
      ? JSON.parse(optionsJson)
      : { skipExisting: false, updateExisting: true, importMedia: true }

    let data: any

    // Parse file
    if (file.name.endsWith('.zip')) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const zip = await JSZip.loadAsync(buffer)
      const dataFile = zip.file('data.json')

      if (!dataFile) {
        return errorResponse('Файл data.json не найден в архиве', 400)
      }

      data = JSON.parse(await dataFile.async('string'))

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
              } catch (error) {
                console.error(`Error importing media file ${filename}:`, error)
              }
            }
          }
        }
      }
    } else if (file.name.endsWith('.json')) {
      const text = await file.text()
      data = JSON.parse(text)
    } else {
      return errorResponse('Неподдерживаемый формат файла', 400)
    }

    // Validate schema
    if (!data.schemaVersion || !data.products || !data.categories) {
      return errorResponse('Неверный формат данных', 400)
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

    // Import categories
    for (const categoryData of data.categories || []) {
      try {
        const existing = await prisma.category.findUnique({
          where: { slug: categoryData.slug },
        })

        if (existing) {
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
              },
            })
            result.processed.categories++
          }
        } else {
          await prisma.category.create({
            data: {
              name: categoryData.name,
              slug: categoryData.slug,
              description: categoryData.description,
              image: categoryData.image,
              parentId: categoryData.parentId,
              isActive: categoryData.isActive ?? true,
              sortOrder: categoryData.sortOrder ?? 0,
              seoTitle: categoryData.seoTitle,
              seoDesc: categoryData.seoDesc,
            },
          })
          result.processed.categories++
        }
      } catch (error: any) {
        result.errors.push(`Ошибка при импорте категории ${categoryData.slug}: ${error.message}`)
      }
    }

    // Import products
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
            const category = await prisma.category.findFirst({
              where: {
                OR: [
                  { slug: productData.categoryObj?.slug },
                  { name: productData.categoryObj?.name },
                ],
              },
            })

            if (!category) {
              result.errors.push(`Категория не найдена для товара ${productData.sku}`)
              continue
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
                stock: productData.stock,
                minOrder: productData.minOrder ?? 1,
                weight: productData.weight?.toString(),
                dimensions: productData.dimensions,
                material: productData.material,
                category: productData.category || 'ECONOMY',
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
          const category = await prisma.category.findFirst({
            where: {
              OR: [
                { slug: productData.categoryObj?.slug },
                { name: productData.categoryObj?.name },
              ],
            },
          })

          if (!category) {
            result.errors.push(`Категория не найдена для товара ${productData.sku}`)
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
              stock: productData.stock,
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

    return successResponse(result, 'Импорт завершен')
  } catch (error: any) {
    console.error('Import error:', error)
    return errorResponse(`Ошибка при импорте: ${error.message}`, 500)
  }
}




