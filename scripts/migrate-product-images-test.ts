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
    console.log(`    [DOWNLOAD] Начало загрузки: ${imageUrl}`)
    
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
    const fileSizeMB = (buffer.length / 1024 / 1024).toFixed(2)
    console.log(`    [DOWNLOAD] Размер файла: ${fileSizeMB} MB`)

    // Проверка размера
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`Файл слишком большой: ${fileSizeMB}MB (максимум: ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
    }

    // Create upload directory if it doesn't exist
    const uploadPath = subfolder ? join(UPLOAD_DIR, subfolder) : UPLOAD_DIR
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true })
      console.log(`    [DOWNLOAD] Создана папка: ${uploadPath}`)
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
    console.log(`    [DOWNLOAD] Сохранено: ${filepath}`)

    // Return URL
    const url = subfolder ? `/uploads/${subfolder}/${filename}` : `/uploads/${filename}`
    console.log(`    [DOWNLOAD] URL для БД: ${url}`)

    return {
      url,
      filename,
    }
  } catch (error: any) {
    console.error(`    [DOWNLOAD] ОШИБКА: ${error.message}`)
    throw new Error(`Ошибка при загрузке изображения ${imageUrl}: ${error.message}`)
  }
}

async function migrateProductImagesTest() {
  console.log('='.repeat(60))
  console.log('🧪 ТЕСТОВАЯ МИГРАЦИЯ ИЗОБРАЖЕНИЙ ТОВАРОВ')
  console.log('='.repeat(60))
  console.log('📋 Обработает только первые 10 товаров с внешними URL\n')

  // Получаем первые 10 товаров с внешними URL изображений
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
    take: 100, // Берем больше, чтобы найти 10 с внешними URL
  })

  console.log(`📊 Найдено товаров всего: ${allProducts.length}`)

  // Фильтруем только те, у которых есть внешние URL
  const productsWithExternalImages = allProducts.filter(product => 
    product.images && product.images.some(img => 
      img.startsWith('http://') || img.startsWith('https://')
    )
  ).slice(0, 10) // Берем первые 10

  console.log(`📊 Товаров с внешними URL: ${productsWithExternalImages.length}\n`)

  if (productsWithExternalImages.length === 0) {
    console.log('⚠️  Не найдено товаров с внешними URL для миграции')
    return
  }

  let processed = 0
  let migrated = 0
  let errors = 0
  let skipped = 0

  const DELAY_BETWEEN_IMAGES = 300 // 300мс между изображениями

  for (let i = 0; i < productsWithExternalImages.length; i++) {
    const product = productsWithExternalImages[i]
    
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`📦 Товар ${i + 1}/${productsWithExternalImages.length}: ${product.title}`)
    console.log(`   ID: ${product.id}`)
    console.log(`   Изображений: ${product.images?.length || 0}`)

    if (!product.images || product.images.length === 0) {
      console.log(`   ⏭️  Пропущен: нет изображений`)
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

    console.log(`   📊 Внешних URL: ${externalImages.length}, локальных: ${localImages.length}`)

    if (externalImages.length === 0) {
      console.log(`   ⏭️  Пропущен: все изображения уже локальные`)
      skipped++
      continue
    }

    const newImages: string[] = []
    let productMigrated = 0
    let productErrors = 0

    // Сначала добавляем локальные изображения
    newImages.push(...localImages)

    // Затем обрабатываем внешние URL
    for (let j = 0; j < externalImages.length; j++) {
      const imageUrl = externalImages[j]
      console.log(`\n   🖼️  Изображение ${j + 1}/${externalImages.length}`)
      
      try {
        const result = await downloadImageFromUrl(imageUrl, 'products')
        newImages.push(result.url)
        productMigrated++
        migrated++
        console.log(`   ✅ Успешно мигрировано`)
        
        // Пауза между загрузками
        if (j < externalImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_IMAGES))
        }
      } catch (error: any) {
        console.error(`   ❌ Ошибка миграции: ${error.message}`)
        // Оставляем оригинальный URL как fallback
        newImages.push(imageUrl)
        productErrors++
        errors++
      }
    }

    // Обновляем товар в БД
    try {
      console.log(`\n   💾 Обновление БД...`)
      await prisma.product.update({
        where: { id: product.id },
        data: { images: newImages },
      })
      
      processed++
      console.log(`   ✅ Товар обновлен в БД`)
      console.log(`   📊 Итого: ${productMigrated} мигрировано, ${productErrors} ошибок`)
    } catch (error: any) {
      console.error(`   ❌ Ошибка обновления БД: ${error.message}`)
      errors++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 ИТОГИ ТЕСТОВОЙ МИГРАЦИИ:')
  console.log('='.repeat(60))
  console.log(`  ✅ Обработано товаров: ${processed}`)
  console.log(`  ⬇️  Мигрировано изображений: ${migrated}`)
  console.log(`  ❌ Ошибок: ${errors}`)
  console.log(`  ⏭️  Пропущено: ${skipped}`)
  console.log(`\n💾 Изображения сохранены в: ${join(UPLOAD_DIR, 'products')}`)
  console.log(`\n💡 Проверьте несколько товаров в БД и на сайте`)
  console.log(`   Если все работает - запустите полную миграцию`)
  console.log('='.repeat(60))
}

migrateProductImagesTest()
  .catch((error) => {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

