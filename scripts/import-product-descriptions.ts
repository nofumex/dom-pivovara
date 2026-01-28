import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'
import Papa from 'papaparse'

const prisma = new PrismaClient()

interface CSVRow {
  IE_NAME: string
  IE_ID: string
  IE_PREVIEW_TEXT: string
  IE_DETAIL_TEXT: string
  IE_CODE: string
}

/**
 * Очищает HTML из текста, преобразуя его в читаемый формат
 */
function cleanHtml(html: string): string {
  if (!html) return ''
  
  // Заменяем HTML entities
  let text = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
  
  // Заменяем <br> и <br/> на переносы строк
  text = text.replace(/<br\s*\/?>/gi, '\n')
  
  // Заменяем </p> на двойной перенос строки
  text = text.replace(/<\/p>/gi, '\n\n')
  
  // Заменяем </div> на перенос строки
  text = text.replace(/<\/div>/gi, '\n')
  
  // Удаляем все HTML теги
  text = text.replace(/<[^>]+>/g, '')
  
  // Очищаем множественные пробелы и переносы строк
  text = text
    .replace(/\n{3,}/g, '\n\n') // Максимум 2 переноса подряд
    .replace(/[ \t]+/g, ' ') // Множественные пробелы в один
    .replace(/[ \t]*\n[ \t]*/g, '\n') // Пробелы вокруг переносов
    .trim()
  
  return text
}

async function importProductDescriptions() {
  console.log('='.repeat(60))
  console.log('🚀 ИМПОРТ ОПИСАНИЙ ТОВАРОВ ИЗ CSV')
  console.log('='.repeat(60))
  
  // Проверка подключения к БД
  console.log('🔌 Проверка подключения к БД...')
  try {
    const productCount = await prisma.product.count()
    console.log(`✅ Подключение успешно. Товаров в БД: ${productCount}`)
  } catch (error: any) {
    console.error(`❌ Ошибка подключения к БД: ${error.message}`)
    console.error(`   Убедитесь, что DATABASE_URL установлен правильно`)
    process.exit(1)
  }
  
  const csvFilePath = join(process.cwd(), 'export_file_chdvogu1ts5xe52d.csv')
  
  console.log(`\n📂 Чтение CSV файла: ${csvFilePath}`)
  
  try {
    const csvContent = readFileSync(csvFilePath, 'utf-8')
    
    // Парсим CSV с разделителем точка с запятой
    const parseResult = Papa.parse<CSVRow>(csvContent, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      quoteChar: '"',
      escapeChar: '"',
      transformHeader: (header) => header.trim(),
      transform: (value) => value?.trim() || '',
    })
    
    if (parseResult.errors.length > 0) {
      console.warn('⚠️  Предупреждения при парсинге CSV:')
      parseResult.errors.slice(0, 10).forEach(err => {
        console.warn(`   Строка ${err.row}: ${err.message}`)
      })
    }
    
    const rows = parseResult.data.filter(row => row.IE_NAME && row.IE_CODE)
    console.log(`📊 Найдено записей: ${rows.length}`)
    
    // Показываем первые несколько записей для проверки
    if (rows.length > 0) {
      console.log(`\n📋 Примеры первых записей:`)
      rows.slice(0, 3).forEach((row, idx) => {
        console.log(`   ${idx + 1}. "${row.IE_NAME}" (slug: ${row.IE_CODE})`)
        console.log(`      Preview: ${row.IE_PREVIEW_TEXT ? row.IE_PREVIEW_TEXT.substring(0, 50) + '...' : 'пусто'}`)
        console.log(`      Detail: ${row.IE_DETAIL_TEXT ? row.IE_DETAIL_TEXT.substring(0, 50) + '...' : 'пусто'}`)
      })
    }
    console.log('')
    
    let updated = 0
    let notFound = 0
    let errors = 0
    let skipped = 0
    
    const BATCH_SIZE = 10 // Уменьшаем размер батча для лучшей отладки
    const startTime = Date.now()
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(rows.length / BATCH_SIZE)
      
      console.log(`\n${'═'.repeat(60)}`)
      console.log(`📦 БАТЧ ${batchNum}/${totalBatches} (строки ${i + 1}-${Math.min(i + BATCH_SIZE, rows.length)})`)
      console.log(`${'═'.repeat(60)}`)
      console.log(`   Начинаем обработку ${batch.length} товаров...`)
      
      for (let j = 0; j < batch.length; j++) {
        const row = batch[j]
        const { IE_NAME, IE_PREVIEW_TEXT, IE_DETAIL_TEXT, IE_CODE } = row
        
        if (!IE_NAME || !IE_CODE) {
          skipped++
          continue
        }
        
        // Логируем начало обработки каждого товара
        console.log(`   🔍 [${i + j + 1}] Обработка: "${IE_NAME.substring(0, 40)}" (slug: ${IE_CODE})`)
        
        try {
          // Ищем товар по slug (IE_CODE) или по названию
          console.log(`      → Поиск по slug: ${IE_CODE}`)
          
          const searchStartTime = Date.now()
          let product = await Promise.race([
            prisma.product.findFirst({
              where: {
                slug: IE_CODE,
              },
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                content: true,
              },
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Таймаут поиска по slug (10 сек)')), 10000)
            )
          ]) as any
          
          const searchTime = Date.now() - searchStartTime
          console.log(`      → Поиск по slug завершен за ${searchTime}мс`)
          
          // Если не нашли по slug, ищем по названию
          if (!product) {
            console.log(`      → Поиск по названию: ${IE_NAME.substring(0, 30)}`)
            
            const nameSearchStartTime = Date.now()
            product = await Promise.race([
              prisma.product.findFirst({
                where: {
                  title: {
                    equals: IE_NAME,
                    mode: 'insensitive',
                  },
                },
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  description: true,
                  content: true,
                },
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Таймаут поиска по названию (10 сек)')), 10000)
              )
            ]) as any
            
            const nameSearchTime = Date.now() - nameSearchStartTime
            console.log(`      → Поиск по названию завершен за ${nameSearchTime}мс`)
          }
          
          if (!product) {
            notFound++
            console.log(`   ⚠️  [${i + j + 1}] Товар не найден: "${IE_NAME.substring(0, 50)}" (slug: ${IE_CODE})`)
            continue
          }
          
          // Логируем найденный товар
          console.log(`   ✅ [${i + j + 1}] Товар найден: "${product.title}" (ID: ${product.id})`)
          
          // Очищаем HTML из описаний
          const cleanPreview = IE_PREVIEW_TEXT ? cleanHtml(IE_PREVIEW_TEXT) : null
          const cleanDetail = IE_DETAIL_TEXT ? cleanHtml(IE_DETAIL_TEXT) : null
          
          console.log(`      → Очистка HTML завершена, начинаем обновление...`)
          
          // Обновляем товар
          const updateStartTime = Date.now()
          await Promise.race([
            prisma.product.update({
              where: { id: product.id },
              data: {
                description: cleanPreview || product.description,
                content: cleanDetail || product.content,
                updatedAt: new Date(),
              },
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Таймаут обновления (10 сек)')), 10000)
            )
          ])
          
          const updateTime = Date.now() - updateStartTime
          console.log(`      → Обновление завершено за ${updateTime}мс`)
          
          updated++
          
          // Выводим информацию для каждого обновления (первые 20), затем каждые 10
          if (updated <= 20 || updated % 10 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
            const progress = ((i + j + 1) / rows.length * 100).toFixed(1)
            console.log(`   ✅ [${i + j + 1}] Обновлен: "${product.title.substring(0, 40)}" | Всего: ${updated} | Прогресс: ${progress}% | Время: ${elapsed}с`)
          }
        } catch (error: any) {
          errors++
          console.error(`   ❌ [${i + j + 1}] Ошибка для "${IE_NAME.substring(0, 50)}": ${error.message}`)
          if (error.code) {
            console.error(`      Код ошибки: ${error.code}`)
          }
          if (errors >= 50) {
            console.error(`   ⚠️  Слишком много ошибок (${errors}), останавливаем обработку`)
            break
          }
        }
      }
      
      // Статистика после батча
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
      const progress = ((i + batch.length) / rows.length * 100).toFixed(1)
      console.log(`\n   📊 Батч завершен: Обновлено: ${updated} | Не найдено: ${notFound} | Ошибок: ${errors} | Прогресс: ${progress}% | Время: ${elapsed}с`)
      
      // Пауза между батчами
      if (i + BATCH_SIZE < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(0)
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 ИТОГИ ИМПОРТА:')
    console.log('='.repeat(60))
    console.log(`  ✅ Обновлено товаров: ${updated}`)
    console.log(`  ⚠️  Товаров не найдено: ${notFound}`)
    console.log(`  ❌ Ошибок: ${errors}`)
    console.log(`  ⏭️  Пропущено: ${skipped}`)
    console.log(`  ⏱️  Общее время: ${totalTime} секунд`)
    console.log('='.repeat(60))
  } catch (error: any) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message)
    if (error.code === 'ENOENT') {
      console.error(`   Файл не найден: ${csvFilePath}`)
      console.error(`   Убедитесь, что файл export_file_chdvogu1ts5xe52d.csv находится в корне проекта`)
    }
    process.exit(1)
  }
}

importProductDescriptions()
  .catch((error) => {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
