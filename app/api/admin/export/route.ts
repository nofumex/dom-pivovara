import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRole } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { errorResponse } from '@/lib/response'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRole(request, [UserRole.ADMIN])
    if (!user) {
      return errorResponse('Не авторизован', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'zip'

    // Get all data
    const [products, categories, settings, heroImages] = await Promise.all([
      prisma.product.findMany({
        include: {
          variants: true,
          categoryObj: true,
        },
      }),
      prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.setting.findMany(),
      prisma.heroImage.findMany({
        orderBy: { order: 'asc' },
      }),
    ])

    // Transform data
    const exportData = {
      schemaVersion: '1.0',
      exportedAt: new Date().toISOString(),
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
        oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
        weight: p.weight ? Number(p.weight) : null,
        rating: p.rating ? Number(p.rating) : 0,
      })),
      categories,
      settings: settings.reduce((acc, s) => {
        acc[s.key] = s.value
        return acc
      }, {} as Record<string, string>),
      heroImages,
      mediaIndex: [] as Array<{ url: string; path: string }>,
    }

    if (format === 'json') {
      return new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="export-${Date.now()}.json"`,
        },
      })
    }

    if (format === 'xlsx') {
      const workbook = XLSX.utils.book_new()

      // Products sheet
      const productsData = products.map((p) => ({
        SKU: p.sku,
        Название: p.title,
        Slug: p.slug,
        Описание: p.description || '',
        Цена: Number(p.price),
        СтараяЦена: p.oldPrice ? Number(p.oldPrice) : '',
        Остаток: p.stock,
        Категория: p.categoryObj.name,
        Активен: p.isActive ? 'Да' : 'Нет',
        Видимость: p.visibility,
      }))
      const productsSheet = XLSX.utils.json_to_sheet(productsData)
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Товары')

      // Categories sheet
      const categoriesData = categories.map((c) => ({
        Название: c.name,
        Slug: c.slug,
        Описание: c.description || '',
        Родитель: c.parentId || '',
        Активна: c.isActive ? 'Да' : 'Нет',
        Порядок: c.sortOrder,
      }))
      const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData)
      XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Категории')

      // Settings sheet
      const settingsData = settings.map((s) => ({
        Ключ: s.key,
        Значение: s.value,
        Тип: s.type,
      }))
      const settingsSheet = XLSX.utils.json_to_sheet(settingsData)
      XLSX.utils.book_append_sheet(workbook, settingsSheet, 'Настройки')

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="export-${Date.now()}.xlsx"`,
        },
      })
    }

    // ZIP format (default)
    const zip = new JSZip()
    zip.file('data.json', JSON.stringify(exportData, null, 2))
    zip.file('README.md', `# Экспорт данных\n\nДата экспорта: ${new Date().toLocaleString('ru-RU')}\n\nСодержимое:\n- Товары: ${products.length}\n- Категории: ${categories.length}\n- Настройки: ${settings.length}\n`)

    // Add media files
    const mediaFolder = zip.folder('media')
    if (mediaFolder) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      
      // Collect all image URLs
      const imageUrls = new Set<string>()
      products.forEach((p) => {
        p.images.forEach((img) => imageUrls.add(img))
        p.variants.forEach((v) => {
          if (v.imageUrl) imageUrls.add(v.imageUrl)
        })
      })
      categories.forEach((c) => {
        if (c.image) imageUrls.add(c.image)
      })
      heroImages.forEach((h) => {
        imageUrls.add(h.url)
      })

      // Add images to zip
      for (const url of imageUrls) {
        if (url.startsWith('/uploads/')) {
          const filePath = join(uploadsDir, url.replace('/uploads/', ''))
          if (existsSync(filePath)) {
            try {
              const fileBuffer = await readFile(filePath)
              const fileName = url.split('/').pop() || 'image.jpg'
              mediaFolder.file(fileName, fileBuffer)
              exportData.mediaIndex.push({ url, path: fileName })
            } catch (error) {
              console.error(`Error adding file ${filePath}:`, error)
            }
          }
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="export-${Date.now()}.zip"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return errorResponse('Ошибка при экспорте данных', 500)
  }
}




