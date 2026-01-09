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
    console.log(`      [DOWNLOAD] Начало загрузки: ${imageUrl.substring(0, 80)}...`)
    
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
    console.log(`      [DOWNLOAD] Размер файла: ${fileSizeMB} MB`)

    // Проверка размера
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`Файл слишком большой: ${fileSizeMB}MB (максимум: ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
    }

    // Create upload directory if it doesn't exist
    const uploadPath = subfolder ? join(UPLOAD_DIR, subfolder) : UPLOAD_DIR
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true })
      console.log(`      [DOWNLOAD] Создана папка: ${uploadPath}`)
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
    console.log(`      [DOWNLOAD] Сохранено: ${filepath}`)

    // Return URL
    const url = subfolder ? `/uploads/${subfolder}/${filename}` : `/uploads/${filename}`
    console.log(`      [DOWNLOAD] URL для БД: ${url}`)

    return {
      url,
      filename,
    }
  } catch (error: any) {
    console.error(`      [DOWNLOAD] ОШИБКА: ${error.message}`)
    throw new Error(`Ошибка при загрузке изображения ${imageUrl}: ${error.message}`)
  }
}

async function migrateCategoryImagesFull() {
  console.log('='.repeat(70))
  console.log('🚀 ПОЛНАЯ МИГРАЦИЯ ИЗОБРАЖЕНИЙ КАТЕГОРИЙ И ПОДКАТЕГОРИЙ')
  console.log('='.repeat(70))
  console.log('⚠️  ВНИМАНИЕ: Это обработает ВСЕ категории всех уровней с внешними URL!')
  console.log('   Убедитесь, что сделали бэкап БД через Neon консоль\n')

  // Получаем ВСЕ категории (все уровни вложенности)
  const allCategories = await prisma.category.findMany({
    where: {
      image: {
        not: null,
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      parentId: true,
    },
    orderBy: [
      { parentId: 'asc' }, // Сначала родительские
      { sortOrder: 'asc' },
    ],
  })

  console.log(`📊 Найдено категорий с изображениями: ${allCategories.length}`)

  // Фильтруем только те, у которых есть внешние URL
  const categoriesWithExternalImages = allCategories.filter(category => 
    category.image && (
      category.image.startsWith('http://') || 
      category.image.startsWith('https://')
    )
  )

  console.log(`📊 Категорий с внешними URL: ${categoriesWithExternalImages.length}\n`)

  if (categoriesWithExternalImages.length === 0) {
    console.log('✅ Все изображения категорий уже мигрированы!')
    return
  }

  // Группируем по уровням для лучшего логирования
  const rootCategories = categoriesWithExternalImages.filter(c => !c.parentId)
  const subCategories = categoriesWithExternalImages.filter(c => c.parentId)
  
  console.log(`📊 Распределение по уровням:`)
  console.log(`   - Родительские категории: ${rootCategories.length}`)
  console.log(`   - Подкатегории: ${subCategories.length}`)
  console.log(`   - Всего к обработке: ${categoriesWithExternalImages.length}\n`)

  let processed = 0
  let migrated = 0
  let errors = 0
  let skipped = 0

  const DELAY_BETWEEN_IMAGES = 300 // 300мс между загрузками
  const startTime = Date.now()

  for (let i = 0; i < categoriesWithExternalImages.length; i++) {
    const category = categoriesWithExternalImages[i]
    
    // Определяем уровень категории
    const level = category.parentId ? '  📁' : '📂'
    const categoryType = category.parentId ? 'Подкатегория' : 'Категория'
    
    console.log(`\n${'─'.repeat(70)}`)
    console.log(`${level} ${categoryType} ${i + 1}/${categoriesWithExternalImages.length}: ${category.name}`)
    console.log(`   ID: ${category.id}`)
    console.log(`   Slug: ${category.slug}`)
    if (category.parentId) {
      console.log(`   Родитель ID: ${category.parentId}`)
    }
    console.log(`   Текущее изображение: ${category.image?.substring(0, 70)}${category.image && category.image.length > 70 ? '...' : ''}`)

    if (!category.image) {
      console.log(`   ⏭️  Пропущена: нет изображения`)
      skipped++
      continue
    }

    // Проверяем, это внешний URL или уже локальный
    if (!category.image.startsWith('http://') && !category.image.startsWith('https://')) {
      console.log(`   ⏭️  Пропущена: изображение уже локальное (${category.image})`)
      skipped++
      continue
    }

    try {
      console.log(`\n   🖼️  Загрузка изображения...`)
      const result = await downloadImageFromUrl(category.image, 'categories')
      
      // Обновляем категорию в БД
      console.log(`\n   💾 Обновление БД...`)
      await prisma.category.update({
        where: { id: category.id },
        data: { image: result.url },
      })
      
      processed++
      migrated++
      console.log(`   ✅ Категория успешно обновлена в БД`)
      console.log(`   📊 Новый путь: ${result.url}`)
      
      // Пауза между загрузками
      if (i < categoriesWithExternalImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_IMAGES))
      }
    } catch (error: any) {
      console.error(`   ❌ ОШИБКА: ${error.message}`)
      errors++
    }

    // Прогресс каждые 5 категорий
    if ((i + 1) % 5 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
      const progress = ((i + 1) / categoriesWithExternalImages.length * 100).toFixed(1)
      const avgTimePerCategory = (parseFloat(elapsed) / (i + 1)).toFixed(1)
      const estimatedRemaining = ((categoriesWithExternalImages.length - i - 1) * parseFloat(avgTimePerCategory)).toFixed(0)
      
      console.log(`\n   ⏱️  ПРОГРЕСС: ${progress}% | Обработано: ${i + 1}/${categoriesWithExternalImages.length}`)
      console.log(`   ⏱️  Время: ${elapsed}с | Среднее: ${avgTimePerCategory}с/категория | Осталось: ~${estimatedRemaining}с`)
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0)
  const totalTimeMinutes = (parseFloat(totalTime) / 60).toFixed(1)

  console.log('\n' + '='.repeat(70))
  console.log('📊 ИТОГИ ПОЛНОЙ МИГРАЦИИ КАТЕГОРИЙ:')
  console.log('='.repeat(70))
  console.log(`  ✅ Обработано категорий: ${processed}`)
  console.log(`  ⬇️  Мигрировано изображений: ${migrated}`)
  console.log(`  ❌ Ошибок: ${errors}`)
  console.log(`  ⏭️  Пропущено: ${skipped}`)
  console.log(`  ⏱️  Общее время: ${totalTime} секунд (${totalTimeMinutes} минут)`)
  console.log(`\n💾 Изображения сохранены в: ${join(UPLOAD_DIR, 'categories')}`)
  console.log(`\n📋 Статистика по уровням:`)
  console.log(`   - Родительские категории обработано: ${rootCategories.filter(c => categoriesWithExternalImages.includes(c)).length}`)
  console.log(`   - Подкатегории обработано: ${subCategories.filter(c => categoriesWithExternalImages.includes(c)).length}`)
  console.log('='.repeat(70))
  
  if (errors > 0) {
    console.log(`\n⚠️  ВНИМАНИЕ: Было ${errors} ошибок. Проверьте логи выше.`)
  } else {
    console.log(`\n✅ Все изображения категорий успешно мигрированы!`)
  }
}

migrateCategoryImagesFull()
  .catch((error) => {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

