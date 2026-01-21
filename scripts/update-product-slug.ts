import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Простая транслитерация кириллицы в латиницу
function transliterate(text: string): string {
  const map: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  }
  
  return text.split('').map(char => map[char] || char).join('')
}

function generateSlug(text: string): string {
  return transliterate(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Удаляем спецсимволы
    .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
    .replace(/-+/g, '-') // Убираем множественные дефисы
    .replace(/^-|-$/g, '') // Убираем дефисы в начале и конце
    .trim()
}

async function main() {
  // Проверяем наличие DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.log(`❌ Ошибка: переменная окружения DATABASE_URL не установлена`)
    console.log(`\n📋 Решение:`)
    console.log(`   Установите переменную окружения перед запуском скрипта:`)
    console.log(`   $env:DATABASE_URL="postgresql://neondb_owner:npg_aEouTH2edw8m@ep-long-bush-a10bntmc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"`)
    console.log(`   npx tsx scripts/update-product-slug.ts`)
    console.log(`\n   Или создайте файл .env с переменной DATABASE_URL`)
    process.exit(1)
  }

  const productTitle = 'Солод Ржаной красный (ферментированный) Курск'
  // Можно указать новый slug как аргумент командной строки
  const newSlugArg = process.argv[2]
  
  console.log(`🔍 Поиск товара с названием: ${productTitle}...`)
  
  const product = await prisma.product.findFirst({
    where: { title: productTitle },
    select: { id: true, title: true, slug: true }
  })

  if (!product) {
    console.log(`❌ Товар не найден`)
    return
  }

  console.log(`✅ Товар найден:`)
  console.log(`   ID: ${product.id}`)
  console.log(`   Название: ${product.title}`)
  console.log(`   Текущий slug: ${product.slug}`)
  
  // Используем переданный slug или генерируем новый
  const newSlug = newSlugArg || generateSlug(productTitle)
  
  if (!newSlug || newSlug === '-') {
    console.log(`❌ Ошибка: не удалось сгенерировать slug. Укажите его вручную:`)
    console.log(`   npx tsx scripts/update-product-slug.ts "solod-rzhanoy-krasnyy-fermentirovannyy-kursk"`)
    return
  }
  
  console.log(`\n🔄 Обновление slug на: ${newSlug}...`)
  
  try {
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { 
        slug: newSlug,
        updatedAt: new Date(),
      },
    })

    console.log(`✅ Slug успешно обновлен!`)
    console.log(`\n📋 Результат:`)
    console.log(`   ID: ${updated.id}`)
    console.log(`   Название: ${updated.title}`)
    console.log(`   Новый slug: ${updated.slug}`)
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log(`❌ Ошибка: slug "${newSlug}" уже существует. Укажите другой slug.`)
    } else {
      console.log(`❌ Ошибка при обновлении:`, error.message)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
