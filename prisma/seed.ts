import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начало заполнения базы данных...')

  // Создание администратора
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@dompivovara.ru'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Администратор',
      lastName: 'Системы',
      role: 'ADMIN',
    },
  })

  console.log('✅ Администратор создан:', admin.email)

  // Создание категорий
  const categories = [
    {
      name: 'Пивоварение',
      slug: 'pivovareniye',
      description: 'Товары для пивоварения',
      subcategories: [
        { name: 'Пивоварни и ЦКТ', slug: 'pivovarni-i-ckt' },
        { name: 'Ингредиенты', slug: 'ingredienty' },
        { name: 'Брожение и розлив', slug: 'brozhenie-i-rozliv' },
        { name: 'Пивные наборы и медовуха', slug: 'nabori-i-medovuha' },
        { name: 'Сидр и медовуха', slug: 'sidr-i-medovuha' },
        { name: 'Дополнительное оборудование', slug: 'dop-oborudovanie' },
      ],
    },
    {
      name: 'Самогоноварение',
      slug: 'samogonovarenie',
      description: 'Товары для самогоноварения',
      subcategories: [
        { name: 'Самогонные аппараты', slug: 'samogonnye-apparaty' },
        { name: 'Комплектующие', slug: 'komplektuyushchie' },
        { name: 'Доп. компоненты', slug: 'dop-komponenty' },
        { name: 'Автоматика', slug: 'avtomatika' },
      ],
    },
    {
      name: 'Виноделие',
      slug: 'vinodeliye',
      description: 'Товары для виноделия',
      subcategories: [
        { name: 'Винодельческое оборудование', slug: 'vinodelcheskoe-oborudovanie' },
        { name: 'Ингредиенты для вина', slug: 'ingredienty-dlya-vina' },
      ],
    },
  ]

  for (const categoryData of categories) {
    const { subcategories, ...categoryInfo } = categoryData
    const category = await prisma.category.upsert({
      where: { slug: categoryInfo.slug },
      update: {},
      create: categoryInfo,
    })

    console.log(`✅ Категория создана: ${category.name}`)

    // Создание подкатегорий
    for (const subcategoryData of subcategories) {
      await prisma.category.upsert({
        where: { slug: subcategoryData.slug },
        update: {},
        create: {
          ...subcategoryData,
          parentId: category.id,
        },
      })
    }
  }

  // Создание тестовых товаров
  const pivovareniyeCategory = await prisma.category.findUnique({
    where: { slug: 'pivovarni-i-ckt' },
  })

  if (pivovareniyeCategory) {
    const products = [
      {
        sku: 'PROD001',
        title: 'Пивоварня Beer Zavodik Start',
        slug: 'pivovarnya-beer-zavodik-start',
        description: 'Комплект для начинающих пивоваров',
        price: 3390,
        stock: 10,
        stockStatus: 'ENOUGH' as const,
        badges: ['HIT' as const],
        images: ['/uploads/placeholder-1.jpg'],
        categoryId: pivovareniyeCategory.id,
      },
      {
        sku: 'PROD002',
        title: 'Пивоварня Beer Zavodik Classic',
        slug: 'pivovarnya-beer-zavodik-classic',
        description: 'Классическая пивоварня для домашнего использования',
        price: 3790,
        stock: 8,
        stockStatus: 'ENOUGH' as const,
        badges: ['HIT' as const],
        images: ['/uploads/placeholder-2.jpg'],
        categoryId: pivovareniyeCategory.id,
      },
      {
        sku: 'PROD003',
        title: 'Крышка для ЦКТ Easy Brew 32 л с чиллером',
        slug: 'kryshka-dlya-ckt-easy-brew-32l',
        description: 'Крышка с чиллером для ЦКТ 32 литра',
        price: 7641,
        stock: 5,
        stockStatus: 'ENOUGH' as const,
        badges: [] as const,
        images: ['/uploads/placeholder-3.jpg'],
        categoryId: pivovareniyeCategory.id,
      },
      {
        sku: 'PROD004',
        title: 'Домашняя пивоварня Бавария "BAVARIA 50L" WiFi',
        slug: 'domashnyaya-pivovarnya-bavariya-50l-wifi',
        description: 'Профессиональная пивоварня с WiFi управлением',
        price: 57990,
        stock: 2,
        stockStatus: 'FEW' as const,
        badges: ['NEW' as const],
        images: ['/uploads/placeholder-4.jpg'],
        categoryId: pivovareniyeCategory.id,
      },
    ]

    for (const productData of products) {
      await prisma.product.upsert({
        where: { sku: productData.sku },
        update: {},
        create: {
          ...productData,
          price: productData.price.toString(),
          rating: 4.5,
          ratingCount: 10,
        },
      })
      console.log(`✅ Товар создан: ${productData.title}`)
    }
  }

  // Создание настроек
  const settings = [
    { key: 'contactEmail', value: 'info@dompivovara.ru', type: 'STRING' as const },
    { key: 'contactPhone', value: '+7 913 555-222-6', type: 'STRING' as const },
    { key: 'address', value: 'г. Москва, ул. Примерная, д. 1', type: 'STRING' as const },
    {
      key: 'socialLinks',
      value: JSON.stringify([
        { label: 'VK', url: 'https://vk.com/dompivovara' },
        { label: 'YouTube', url: 'https://youtube.com/@dompivovara' },
        { label: 'Telegram', url: 'https://t.me/dompivovara' },
      ]),
      type: 'JSON' as const,
    },
    { key: 'minOrderTotal', value: '1000', type: 'NUMBER' as const },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('✅ Настройки созданы')

  console.log('🎉 Заполнение базы данных завершено!')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
