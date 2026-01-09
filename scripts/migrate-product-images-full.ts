import { PrismaClient } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const prisma = new PrismaClient()

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) // 10MB default

/**
 * Загружает изображение по URL и сохраняет локально БЕЗ сжатия
 */
async function downloadImageFromUrl(
  imageUrl: string,
  subfolder: string = ''
): Promise<{ url: string; filename: string }> {
  try {
    // Загружаем изображение
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      throw new Error(`Неверный content-type: ${contentType}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    // Проверка размера
    if (buffer.length > MAX_FILE_SIZE) {
      const fileSizeMB = (buffer.length / 1024 / 1024).toFixed(2)
      throw new Error(`Файл слишком большой: ${fileSizeMB}MB (максимум: ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
    }

    // Create upload directory if it doesn't exist
    const uploadPath = subfolder ? join(UPLOAD_DIR, subfolder) : UPLOAD_DIR
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true })
    }

    // Определяем расширение из URL или content-type
    const urlExtension = imageUrl.split('.').pop()?.toLowerCase() || 'jpg'
    const extension = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(urlExtension) 
      ? urlExtension 
      : contentType.includes('png') ? 'png' 
      : contentType.includes('webp') ? 'webp'
      : contentType.includes('gif') ? 'gif'
      : 'jpg'

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const filename = `${timestamp}-${random}.${extension}`
    const filepath = join(uploadPath, filename)

    // Сохраняем БЕЗ сжатия (оригинальный размер)
    await writeFile(filepath, buffer)

    // Return URL
    const url = subfolder ? `/uploads/${subfolder}/${filename}` : `/uploads/${filename}`

    return {
      url,
      filename,
    }
  } catch (error: any) {
    throw new Error(`Ошибка при загрузке изображения ${imageUrl}: ${error.message}`)
  }
}

async function migrateProductImagesFull() {
  console.log('='.repeat(60))
  console.log('🚀 ПОЛНАЯ МИГРАЦИЯ ИЗОБРАЖЕНИЙ ТОВАРОВ')
  console.log('='.repeat(60))
  console.log('⚠️  ВНИМАНИЕ: Это обработает ВСЕ товары с внешними URL!')
  console.log('   Убедитесь, что сделали бэкап БД через Neon консоль\n')

  // Получаем все товары с внешними URL изображений
  const allProducts = await prisma.product.findMany({
    where: {
      images: {
        isEmpty: false,
      },
    },
    select: {
      id: true,
      title: true,
      images: true,
    },
  })

  console.log(`📊 Найдено товаров всего: ${allProducts.length}`)

  // Фильтруем только те, у которых есть внешние URL
  const productsWithExternalImages = allProducts.filter(product => 
    product.images && product.images.some(img => 
      img.startsWith('http://') || img.startsWith('https://')
    )
  )

  console.log(`📊 Товаров с внешними URL: ${productsWithExternalImages.length}\n`)

  if (productsWithExternalImages.length === 0) {
    console.log('✅ Все изображения уже мигрированы!')
    return
  }

  let processed = 0
  let migrated = 0
  let errors = 0
  let skipped = 0

  // Обрабатываем товары батчами
  const BATCH_SIZE = 10
  const DELAY_BETWEEN_BATCHES = 2000 // 2 секунды между батчами
  const DELAY_BETWEEN_IMAGES = 300 // 300мс между изображениями

  const startTime = Date.now()

  for (let i = 0; i < productsWithExternalImages.length; i += BATCH_SIZE) {
    const batch = productsWithExternalImages.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(productsWithExternalImages.length / BATCH_SIZE)
    
    console.log(`\n${'═'.repeat(60)}`)
    console.log(`📦 БАТЧ ${batchNum}/${totalBatches} (товары ${i + 1}-${Math.min(i + BATCH_SIZE, productsWithExternalImages.length)})`)
    console.log(`${'═'.repeat(60)}`)

    for (const product of batch) {
      if (!product.images || product.images.length === 0) {
        skipped++
        continue
      }

      // Проверяем, есть ли внешние URL
      const externalImages = product.images.filter(img => 
        img.startsWith('http://') || img.startsWith('https://')
      )
      const localImages = product.images.filter(img => 
        !img.startsWith('http://') && !img.startsWith('https://')
      )

      if (externalImages.length === 0) {
        skipped++
        continue
      }

      console.log(`\n  📦 ${product.title.substring(0, 50)}${product.title.length > 50 ? '...' : ''}`)
      console.log(`     Внешних: ${externalImages.length}, локальных: ${localImages.length}`)

      const newImages: string[] = []
      let productMigrated = 0
      let productErrors = 0

      // Сначала добавляем локальные изображения
      newImages.push(...localImages)

      // Затем обрабатываем внешние URL
      for (let j = 0; j < externalImages.length; j++) {
        const imageUrl = externalImages[j]
        
        try {
          const result = await downloadImageFromUrl(imageUrl, 'products')
          newImages.push(result.url)
          productMigrated++
          migrated++
          
          // Пауза между загрузками
          if (j < externalImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_IMAGES))
          }
        } catch (error: any) {
          console.error(`     ❌ Ошибка: ${error.message.substring(0, 60)}...`)
          // Оставляем оригинальный URL как fallback
          newImages.push(imageUrl)
          productErrors++
          errors++
        }
      }

      // Обновляем товар в БД
      try {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: newImages },
        })
        
        processed++
        if (productMigrated > 0) {
          console.log(`     ✅ Мигрировано: ${productMigrated}, ошибок: ${productErrors}`)
        }
      } catch (error: any) {
        console.error(`     ❌ Ошибка обновления БД: ${error.message}`)
        errors++
      }
    }

    // Прогресс
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    const progress = ((i + batch.length) / productsWithExternalImages.length * 100).toFixed(1)
    console.log(`\n  ⏱️  Прогресс: ${progress}% | Обработано: ${i + batch.length}/${productsWithExternalImages.length} | Время: ${elapsed}с`)

    // Пауза между батчами
    if (i + BATCH_SIZE < productsWithExternalImages.length) {
      console.log(`  ⏳ Пауза ${DELAY_BETWEEN_BATCHES / 1000} сек перед следующим батчем...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0)

  console.log('\n' + '='.repeat(60))
  console.log('📊 ИТОГИ ПОЛНОЙ МИГРАЦИИ:')
  console.log('='.repeat(60))
  console.log(`  ✅ Обработано товаров: ${processed}`)
  console.log(`  ⬇️  Мигрировано изображений: ${migrated}`)
  console.log(`  ❌ Ошибок: ${errors}`)
  console.log(`  ⏭️  Пропущено: ${skipped}`)
  console.log(`  ⏱️  Общее время: ${totalTime} секунд`)
  console.log(`\n💾 Изображения сохранены в: ${join(UPLOAD_DIR, 'products')}`)
  console.log('='.repeat(60))
}

migrateProductImagesFull()
  .catch((error) => {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

