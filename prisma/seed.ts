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

  // Создание тестовых пользователей
  const testUsers = [
    {
      email: 'user@test.ru',
      password: 'user123',
      firstName: 'Тестовый',
      lastName: 'Пользователь',
      role: 'CUSTOMER' as const,
    },
    {
      email: 'admin@test.ru',
      password: 'admin123',
      firstName: 'Тестовый',
      lastName: 'Админ',
      role: 'ADMIN' as const,
    },
  ]

  for (const userData of testUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: hashedPassword,
      },
    })
    console.log(`✅ Тестовый пользователь создан: ${userData.email} (пароль: ${userData.password})`)
  }

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

  // Получение всех категорий
  const pivovareniyeCategory = await prisma.category.findUnique({
    where: { slug: 'pivovarni-i-ckt' },
  })
  
  const ingredientyCategory = await prisma.category.findUnique({
    where: { slug: 'ingredienty' },
  })
  
  const brozhenieCategory = await prisma.category.findUnique({
    where: { slug: 'brozhenie-i-rozliv' },
  })
  
  const naboriCategory = await prisma.category.findUnique({
    where: { slug: 'nabori-i-medovuha' },
  })
  
  const dopOborudovanieCategory = await prisma.category.findUnique({
    where: { slug: 'dop-oborudovanie' },
  })
  
  const samogonCategory = await prisma.category.findFirst({
    where: { slug: 'samogonnye-apparaty' },
  })
  
  const komplektuyushchieCategory = await prisma.category.findFirst({
    where: { slug: 'komplektuyushchie' },
  })
  
  const dopKomponentyCategory = await prisma.category.findFirst({
    where: { slug: 'dop-komponenty' },
  })
  
  const avtomatikaCategory = await prisma.category.findFirst({
    where: { slug: 'avtomatika' },
  })
  
  const vinodelcheskoeCategory = await prisma.category.findFirst({
    where: { slug: 'vinodelcheskoe-oborudovanie' },
  })
  
  const ingredientyVinaCategory = await prisma.category.findFirst({
    where: { slug: 'ingredienty-dlya-vina' },
  })

  // Товары для вкладки "Хиты продаж" (HIT)
  const hitProducts = [
    {
      sku: 'HIT001',
      title: 'Самогонный аппарат Люкссталь LUXSTAHL 8M 37л',
      slug: 'samogonnyj-apparat-lyuksstal-luxstahl-8m-37l',
      description: 'Профессиональный самогонный аппарат объемом 37 литров',
      price: 41981,
      stock: 0,
      stockStatus: 'NONE' as const,
      badges: ['HIT' as const],
      images: ['/uploads/placeholder-1.jpg'],
      categoryId: samogonCategory?.id || pivovareniyeCategory?.id || '',
      rating: 3.0,
      ratingCount: 5,
    },
    {
      sku: 'HIT002',
      title: 'Солодовый экстракт "Кукуруза и карамельный солод", 4.1 кг',
      slug: 'solodovyj-ekstrakt-kukuruza-i-karamelnyj-solod-4-1-kg',
      description: 'Готовый солодовый экстракт для пивоварения',
      price: 1090,
      stock: 15,
      stockStatus: 'ENOUGH' as const,
      badges: ['HIT' as const],
      images: ['/uploads/placeholder-2.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 2.0,
      ratingCount: 3,
    },
    {
      sku: 'HIT003',
      title: 'Хмель "Подвязный" (Россия, Чувашия), 50гр',
      slug: 'hmel-podvyaznyj-rossiya-chuvashiya-50gr',
      description: 'Качественный хмель из Чувашии',
      price: 109,
      stock: 50,
      stockStatus: 'MANY' as const,
      badges: ['HIT' as const],
      images: ['/uploads/placeholder-3.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 5.0,
      ratingCount: 12,
    },
    {
      sku: 'HIT004',
      title: 'Хмель гранулированный "Ранний Московский" (Россия, Чувашия), 50гр',
      slug: 'hmel-granulirovannyj-rannij-moskovskij-rossiya-chuvashiya-50gr',
      description: 'Гранулированный хмель раннего сорта',
      price: 109,
      stock: 45,
      stockStatus: 'MANY' as const,
      badges: ['HIT' as const],
      images: ['/uploads/placeholder-4.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 4.0,
      ratingCount: 8,
    },
    {
      sku: 'HIT005',
      title: 'Хмель "Истринский" (Россия, Чувашия), 50гр',
      slug: 'hmel-istrinskij-rossiya-chuvashiya-50gr',
      description: 'Хмель сорта Истринский',
      price: 109,
      stock: 40,
      stockStatus: 'MANY' as const,
      badges: ['HIT' as const],
      images: ['/uploads/placeholder-5.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 5.0,
      ratingCount: 15,
    },
    {
      sku: 'HIT006',
      title: 'Солод "Пэйл-эль" (Pale ale) Bestmalz, 1кг',
      slug: 'solod-pejl-el-pale-ale-bestmalz-1kg',
      description: 'Солод для светлого эля',
      price: 250,
      stock: 30,
      stockStatus: 'MANY' as const,
      badges: ['HIT' as const],
      images: ['/uploads/placeholder-6.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 5.0,
      ratingCount: 20,
    },
    {
      sku: 'HIT007',
      title: 'Солод "Пилсен" Курск, 1кг',
      slug: 'solod-pilsen-kursk-1kg',
      description: 'Пилсенский солод производства Курск',
      price: 220,
      stock: 35,
      stockStatus: 'MANY' as const,
      badges: ['HIT' as const],
      images: ['/uploads/placeholder-7.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 5.0,
      ratingCount: 18,
    },
    {
      sku: 'HIT008',
      title: 'Солод "Пилсен" Курск, 50кг',
      slug: 'solod-pilsen-kursk-50kg',
      description: 'Пилсенский солод производства Курск, оптовая упаковка',
      price: 10500,
      stock: 8,
      stockStatus: 'ENOUGH' as const,
      badges: ['HIT' as const],
      images: ['/uploads/placeholder-8.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 5.0,
      ratingCount: 7,
    },
  ]

  // Товары для вкладки "Новинки" (NEW)
  const newProducts = [
    {
      sku: 'NEW001',
      title: 'Пивоварня Beer Zavodik Start',
      slug: 'pivovarnya-beer-zavodik-start',
      description: 'Комплект для начинающих пивоваров',
      price: 3390,
      stock: 10,
      stockStatus: 'ENOUGH' as const,
      badges: ['NEW' as const],
      images: ['/uploads/placeholder-9.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.5,
      ratingCount: 10,
    },
    {
      sku: 'NEW002',
      title: 'Домашняя пивоварня Бавария "BAVARIA 50L" WiFi',
      slug: 'domashnyaya-pivovarnya-bavariya-50l-wifi',
      description: 'Профессиональная пивоварня с WiFi управлением',
      price: 57990,
      stock: 2,
      stockStatus: 'FEW' as const,
      badges: ['NEW' as const],
      images: ['/uploads/placeholder-10.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.8,
      ratingCount: 5,
    },
    {
      sku: 'NEW003',
      title: 'Набор для пивоварения "Премиум"',
      slug: 'nabor-dlya-pivovareniya-premium',
      description: 'Полный набор для профессионального пивоварения',
      price: 12500,
      stock: 5,
      stockStatus: 'ENOUGH' as const,
      badges: ['NEW' as const],
      images: ['/uploads/placeholder-11.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.7,
      ratingCount: 3,
    },
    {
      sku: 'NEW004',
      title: 'Хмель "Цитра" (Citra), 100гр',
      slug: 'hmel-citra-citra-100gr',
      description: 'Американский хмель с цитрусовым ароматом',
      price: 450,
      stock: 20,
      stockStatus: 'ENOUGH' as const,
      badges: ['NEW' as const],
      images: ['/uploads/placeholder-12.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 4.9,
      ratingCount: 6,
    },
    {
      sku: 'NEW005',
      title: 'Солод "Карамельный" (Caramel), 1кг',
      slug: 'solod-karamelnyj-caramel-1kg',
      description: 'Карамельный солод для темного пива',
      price: 280,
      stock: 25,
      stockStatus: 'MANY' as const,
      badges: ['NEW' as const],
      images: ['/uploads/placeholder-13.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 4.6,
      ratingCount: 4,
    },
    {
      sku: 'NEW006',
      title: 'Дрожжи пивные сухие Safale US-05, 11.5г',
      slug: 'drozhzhi-pivnye-suhie-safale-us-05-11-5g',
      description: 'Американские пивные дрожжи',
      price: 120,
      stock: 40,
      stockStatus: 'MANY' as const,
      badges: ['NEW' as const],
      images: ['/uploads/placeholder-14.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 4.8,
      ratingCount: 9,
    },
    {
      sku: 'NEW007',
      title: 'ЦКТ (Циклонно-охлаждающий танк) 30л',
      slug: 'ckt-ciklonno-ohlazhdayushchij-tank-30l',
      description: 'Циклонно-охлаждающий танк для брожения',
      price: 8500,
      stock: 6,
      stockStatus: 'ENOUGH' as const,
      badges: ['NEW' as const],
      images: ['/uploads/placeholder-15.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.5,
      ratingCount: 2,
    },
    {
      sku: 'NEW008',
      title: 'Термометр цифровой для пивоварения',
      slug: 'termometr-cifrovoj-dlya-pivovareniya',
      description: 'Точный цифровой термометр',
      price: 890,
      stock: 15,
      stockStatus: 'ENOUGH' as const,
      badges: ['NEW' as const],
      images: ['/uploads/placeholder-16.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.4,
      ratingCount: 7,
    },
  ]

  // Товары для вкладки "По акции" (SALE)
  const saleProducts = [
    {
      sku: 'SALE001',
      title: 'Пивоварня Beer Zavodik Classic',
      slug: 'pivovarnya-beer-zavodik-classic',
      description: 'Классическая пивоварня для домашнего использования',
      price: 3200,
      oldPrice: 3790,
      stock: 8,
      stockStatus: 'ENOUGH' as const,
      badges: ['SALE' as const],
      images: ['/uploads/placeholder-17.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.6,
      ratingCount: 12,
    },
    {
      sku: 'SALE002',
      title: 'Крышка для ЦКТ Easy Brew 32 л с чиллером',
      slug: 'kryshka-dlya-ckt-easy-brew-32l',
      description: 'Крышка с чиллером для ЦКТ 32 литра',
      price: 6500,
      oldPrice: 7641,
      stock: 5,
      stockStatus: 'ENOUGH' as const,
      badges: ['SALE' as const],
      images: ['/uploads/placeholder-18.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.3,
      ratingCount: 8,
    },
    {
      sku: 'SALE003',
      title: 'Хмель "Каскад" (Cascade), 50гр',
      slug: 'hmel-kaskad-cascade-50gr',
      description: 'Американский хмель Каскад',
      price: 95,
      oldPrice: 120,
      stock: 30,
      stockStatus: 'MANY' as const,
      badges: ['SALE' as const],
      images: ['/uploads/placeholder-19.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 4.7,
      ratingCount: 11,
    },
    {
      sku: 'SALE004',
      title: 'Солод "Мюнхенский" (Munich), 1кг',
      slug: 'solod-myunhenskij-munich-1kg',
      description: 'Мюнхенский солод для темного пива',
      price: 200,
      oldPrice: 250,
      stock: 20,
      stockStatus: 'ENOUGH' as const,
      badges: ['SALE' as const],
      images: ['/uploads/placeholder-20.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 4.5,
      ratingCount: 14,
    },
    {
      sku: 'SALE005',
      title: 'Набор ингредиентов для IPA',
      slug: 'nabor-ingredientov-dlya-ipa',
      description: 'Готовый набор для приготовления IPA',
      price: 1800,
      oldPrice: 2200,
      stock: 12,
      stockStatus: 'ENOUGH' as const,
      badges: ['SALE' as const],
      images: ['/uploads/placeholder-21.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 4.8,
      ratingCount: 6,
    },
    {
      sku: 'SALE006',
      title: 'Бутылки для пива стеклянные, 0.5л (12 шт)',
      slug: 'butylki-dlya-piva-steklyannye-0-5l-12-sht',
      description: 'Набор стеклянных бутылок для розлива',
      price: 450,
      oldPrice: 600,
      stock: 25,
      stockStatus: 'MANY' as const,
      badges: ['SALE' as const],
      images: ['/uploads/placeholder-22.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.2,
      ratingCount: 9,
    },
    {
      sku: 'SALE007',
      title: 'Кеги для пива 5л',
      slug: 'kegi-dlya-piva-5l',
      description: 'Кеги из нержавеющей стали',
      price: 3200,
      oldPrice: 3800,
      stock: 7,
      stockStatus: 'ENOUGH' as const,
      badges: ['SALE' as const],
      images: ['/uploads/placeholder-23.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.6,
      ratingCount: 5,
    },
    {
      sku: 'SALE008',
      title: 'Дрожжи пивные жидкие Wyeast 1056, 125мл',
      slug: 'drozhzhi-pivnye-zhidkie-wyeast-1056-125ml',
      description: 'Американские жидкие пивные дрожжи',
      price: 350,
      oldPrice: 450,
      stock: 18,
      stockStatus: 'ENOUGH' as const,
      badges: ['SALE' as const],
      images: ['/uploads/placeholder-24.jpg'],
      categoryId: ingredientyCategory?.id || pivovareniyeCategory?.id || '',
      rating: 4.9,
      ratingCount: 13,
    },
  ]

  // Дополнительные товары для всех категорий
  const additionalProducts = [
    // Пивоварни и ЦКТ
    {
      sku: 'PIV001',
      title: 'Пивоварня Beer Zavodik Pro 50л',
      slug: 'pivovarnya-beer-zavodik-pro-50l',
      description: 'Профессиональная пивоварня на 50 литров',
      price: 45900,
      stock: 3,
      stockStatus: 'FEW' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-piv001.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.7,
      ratingCount: 8,
    },
    {
      sku: 'PIV002',
      title: 'ЦКТ (Циклонно-охлаждающий танк) 50л',
      slug: 'ckt-ciklonno-ohlazhdayushchij-tank-50l',
      description: 'Большой ЦКТ для брожения',
      price: 12500,
      stock: 5,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-piv002.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.5,
      ratingCount: 6,
    },
    {
      sku: 'PIV003',
      title: 'Пивоварня Easy Brew 30л',
      slug: 'pivovarnya-easy-brew-30l',
      description: 'Компактная пивоварня для дома',
      price: 18900,
      stock: 8,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-piv003.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.6,
      ratingCount: 12,
    },
    {
      sku: 'PIV004',
      title: 'Крышка для ЦКТ с гидрозатвором 30л',
      slug: 'kryshka-dlya-ckt-s-gidrozatvorom-30l',
      description: 'Крышка с гидрозатвором для брожения',
      price: 1200,
      stock: 15,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-piv004.jpg'],
      categoryId: pivovareniyeCategory?.id || '',
      rating: 4.4,
      ratingCount: 9,
    },
    // Ингредиенты
    {
      sku: 'ING001',
      title: 'Хмель "Амарилло" (Amarillo), 100гр',
      slug: 'hmel-amarillo-amarillo-100gr',
      description: 'Американский хмель с цитрусовым ароматом',
      price: 480,
      stock: 25,
      stockStatus: 'MANY' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-ing001.jpg'],
      categoryId: ingredientyCategory?.id || '',
      rating: 4.8,
      ratingCount: 11,
    },
    {
      sku: 'ING002',
      title: 'Хмель "Мозаик" (Mosaic), 100гр',
      slug: 'hmel-mozaik-mosaic-100gr',
      description: 'Хмель с тропическим ароматом',
      price: 520,
      stock: 20,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-ing002.jpg'],
      categoryId: ingredientyCategory?.id || '',
      rating: 4.9,
      ratingCount: 14,
    },
    {
      sku: 'ING003',
      title: 'Солод "Венский" (Vienna), 1кг',
      slug: 'solod-venskij-vienna-1kg',
      description: 'Венский солод для светлого пива',
      price: 240,
      stock: 30,
      stockStatus: 'MANY' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-ing003.jpg'],
      categoryId: ingredientyCategory?.id || '',
      rating: 4.6,
      ratingCount: 10,
    },
    {
      sku: 'ING004',
      title: 'Солод "Шоколадный" (Chocolate), 1кг',
      slug: 'solod-shokoladnyj-chocolate-1kg',
      description: 'Темный солод для портера и стаута',
      price: 320,
      stock: 18,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-ing004.jpg'],
      categoryId: ingredientyCategory?.id || '',
      rating: 4.7,
      ratingCount: 7,
    },
    {
      sku: 'ING005',
      title: 'Дрожжи пивные сухие Safale S-04, 11.5г',
      slug: 'drozhzhi-pivnye-suhie-safale-s-04-11-5g',
      description: 'Английские элевые дрожжи',
      price: 110,
      stock: 45,
      stockStatus: 'MANY' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-ing005.jpg'],
      categoryId: ingredientyCategory?.id || '',
      rating: 4.5,
      ratingCount: 16,
    },
    {
      sku: 'ING006',
      title: 'Дрожжи пивные жидкие Wyeast 1968, 125мл',
      slug: 'drozhzhi-pivnye-zhidkie-wyeast-1968-125ml',
      description: 'Английские элевые дрожжи',
      price: 380,
      stock: 12,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-ing006.jpg'],
      categoryId: ingredientyCategory?.id || '',
      rating: 4.6,
      ratingCount: 5,
    },
    {
      sku: 'ING007',
      title: 'Солод "Вит" (Wheat), 1кг',
      slug: 'solod-vit-wheat-1kg',
      description: 'Пшеничный солод для вайсбира',
      price: 260,
      stock: 22,
      stockStatus: 'MANY' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-ing007.jpg'],
      categoryId: ingredientyCategory?.id || '',
      rating: 4.8,
      ratingCount: 13,
    },
    {
      sku: 'ING008',
      title: 'Хмель "Симко" (Simcoe), 100гр',
      slug: 'hmel-simko-simcoe-100gr',
      description: 'Американский хмель с хвойным ароматом',
      price: 550,
      stock: 15,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-ing008.jpg'],
      categoryId: ingredientyCategory?.id || '',
      rating: 4.9,
      ratingCount: 9,
    },
    // Брожение и розлив
    {
      sku: 'BRO001',
      title: 'Гидрозатвор для брожения',
      slug: 'gidrozatvor-dlya-brozheniya',
      description: 'Гидрозатвор для бродильных емкостей',
      price: 150,
      stock: 50,
      stockStatus: 'MANY' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-bro001.jpg'],
      categoryId: brozhenieCategory?.id || '',
      rating: 4.3,
      ratingCount: 20,
    },
    {
      sku: 'BRO002',
      title: 'Бутылки для пива стеклянные, 0.5л (24 шт)',
      slug: 'butylki-dlya-piva-steklyannye-0-5l-24-sht',
      description: 'Набор стеклянных бутылок',
      price: 850,
      stock: 30,
      stockStatus: 'MANY' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-bro002.jpg'],
      categoryId: brozhenieCategory?.id || '',
      rating: 4.4,
      ratingCount: 15,
    },
    {
      sku: 'BRO003',
      title: 'Кеги для пива 19л',
      slug: 'kegi-dlya-piva-19l',
      description: 'Большие кеги из нержавеющей стали',
      price: 8500,
      stock: 4,
      stockStatus: 'FEW' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-bro003.jpg'],
      categoryId: brozhenieCategory?.id || '',
      rating: 4.7,
      ratingCount: 3,
    },
    {
      sku: 'BRO004',
      title: 'Автоматический разливочный аппарат',
      slug: 'avtomaticheskij-razlivochnyj-apparat',
      description: 'Аппарат для розлива пива в бутылки',
      price: 12500,
      stock: 2,
      stockStatus: 'FEW' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-bro004.jpg'],
      categoryId: brozhenieCategory?.id || '',
      rating: 4.6,
      ratingCount: 2,
    },
    // Пивные наборы
    {
      sku: 'NAB001',
      title: 'Набор для пивоварения "Начинающий"',
      slug: 'nabor-dlya-pivovareniya-nachinayushchij',
      description: 'Полный набор для начинающих пивоваров',
      price: 5500,
      stock: 10,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-nab001.jpg'],
      categoryId: naboriCategory?.id || '',
      rating: 4.5,
      ratingCount: 8,
    },
    {
      sku: 'NAB002',
      title: 'Набор для IPA "Американский"',
      slug: 'nabor-dlya-ipa-amerikanskij',
      description: 'Готовый набор для IPA',
      price: 2200,
      stock: 15,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-nab002.jpg'],
      categoryId: naboriCategory?.id || '',
      rating: 4.8,
      ratingCount: 12,
    },
    {
      sku: 'NAB003',
      title: 'Набор для стаута "Ирландский"',
      slug: 'nabor-dlya-stauta-irlandskij',
      description: 'Готовый набор для ирландского стаута',
      price: 2400,
      stock: 12,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-nab003.jpg'],
      categoryId: naboriCategory?.id || '',
      rating: 4.7,
      ratingCount: 6,
    },
    // Дополнительное оборудование
    {
      sku: 'DOP001',
      title: 'Термометр цифровой с зондом',
      slug: 'termometr-cifrovoj-s-zondom',
      description: 'Точный термометр для контроля температуры',
      price: 1200,
      stock: 20,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-dop001.jpg'],
      categoryId: dopOborudovanieCategory?.id || '',
      rating: 4.6,
      ratingCount: 14,
    },
    {
      sku: 'DOP002',
      title: 'Ареометр для измерения плотности',
      slug: 'areometr-dlya-izmereniya-plotnosti',
      description: 'Ареометр для контроля процесса брожения',
      price: 350,
      stock: 35,
      stockStatus: 'MANY' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-dop002.jpg'],
      categoryId: dopOborudovanieCategory?.id || '',
      rating: 4.4,
      ratingCount: 18,
    },
    {
      sku: 'DOP003',
      title: 'Фильтр для пива',
      slug: 'filt-dlya-piva',
      description: 'Фильтр для очистки пива',
      price: 890,
      stock: 18,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-dop003.jpg'],
      categoryId: dopOborudovanieCategory?.id || '',
      rating: 4.5,
      ratingCount: 9,
    },
    // Самогонные аппараты
    {
      sku: 'SAM001',
      title: 'Самогонный аппарат "Классик" 20л',
      slug: 'samogonnyj-apparat-klassik-20l',
      description: 'Классический самогонный аппарат',
      price: 18900,
      stock: 6,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-sam001.jpg'],
      categoryId: samogonCategory?.id || '',
      rating: 4.5,
      ratingCount: 7,
    },
    {
      sku: 'SAM002',
      title: 'Самогонный аппарат "Премиум" 30л',
      slug: 'samogonnyj-apparat-premium-30l',
      description: 'Премиум аппарат с автоматикой',
      price: 32900,
      stock: 3,
      stockStatus: 'FEW' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-sam002.jpg'],
      categoryId: samogonCategory?.id || '',
      rating: 4.8,
      ratingCount: 5,
    },
    {
      sku: 'SAM003',
      title: 'Самогонный аппарат "Эконом" 15л',
      slug: 'samogonnyj-apparat-ekonom-15l',
      description: 'Бюджетный вариант для начинающих',
      price: 12900,
      stock: 10,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-sam003.jpg'],
      categoryId: samogonCategory?.id || '',
      rating: 4.3,
      ratingCount: 11,
    },
    // Комплектующие для самогоноварения
    {
      sku: 'KOM001',
      title: 'Сухопарник для самогонного аппарата',
      slug: 'suhoparnik-dlya-samogonnogo-apparata',
      description: 'Сухопарник для очистки дистиллята',
      price: 1200,
      stock: 25,
      stockStatus: 'MANY' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-kom001.jpg'],
      categoryId: komplektuyushchieCategory?.id || '',
      rating: 4.4,
      ratingCount: 16,
    },
    {
      sku: 'KOM002',
      title: 'Холодильник для самогонного аппарата',
      slug: 'holodilnik-dlya-samogonnogo-apparata',
      description: 'Холодильник для конденсации паров',
      price: 2500,
      stock: 15,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-kom002.jpg'],
      categoryId: komplektuyushchieCategory?.id || '',
      rating: 4.6,
      ratingCount: 8,
    },
    {
      sku: 'KOM003',
      title: 'Царга для ректификационной колонны',
      slug: 'tsarga-dlya-rektifikatsionnoj-kolonny',
      description: 'Царга для увеличения высоты колонны',
      price: 1800,
      stock: 12,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-kom003.jpg'],
      categoryId: komplektuyushchieCategory?.id || '',
      rating: 4.5,
      ratingCount: 6,
    },
    // Доп. компоненты
    {
      sku: 'DOPK001',
      title: 'Активированный уголь для очистки',
      slug: 'aktivirovannyj-ugol-dlya-ochistki',
      description: 'Уголь для очистки самогона',
      price: 450,
      stock: 40,
      stockStatus: 'MANY' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-dopk001.jpg'],
      categoryId: dopKomponentyCategory?.id || '',
      rating: 4.3,
      ratingCount: 22,
    },
    {
      sku: 'DOPK002',
      title: 'Дрожжи спиртовые турбо 50г',
      slug: 'drozhzhi-spirtovye-turbo-50g',
      description: 'Быстрые дрожжи для браги',
      price: 180,
      stock: 50,
      stockStatus: 'MANY' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-dopk002.jpg'],
      categoryId: dopKomponentyCategory?.id || '',
      rating: 4.5,
      ratingCount: 28,
    },
    {
      sku: 'DOPK003',
      title: 'Сахар для браги 5кг',
      slug: 'sahar-dlya-bragi-5kg',
      description: 'Специальный сахар для самогоноварения',
      price: 350,
      stock: 30,
      stockStatus: 'MANY' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-dopk003.jpg'],
      categoryId: dopKomponentyCategory?.id || '',
      rating: 4.2,
      ratingCount: 19,
    },
    // Автоматика
    {
      sku: 'AVT001',
      title: 'Термостат для самогонного аппарата',
      slug: 'termostat-dlya-samogonnogo-apparata',
      description: 'Автоматический контроль температуры',
      price: 5500,
      stock: 5,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-avt001.jpg'],
      categoryId: avtomatikaCategory?.id || '',
      rating: 4.7,
      ratingCount: 4,
    },
    {
      sku: 'AVT002',
      title: 'Таймер для процесса дистилляции',
      slug: 'tajmer-dlya-protsessa-distillyatsii',
      description: 'Таймер с автоматическим отключением',
      price: 2200,
      stock: 8,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-avt002.jpg'],
      categoryId: avtomatikaCategory?.id || '',
      rating: 4.6,
      ratingCount: 6,
    },
    // Винодельческое оборудование
    {
      sku: 'VIN001',
      title: 'Пресс для винограда 20л',
      slug: 'press-dlya-vinograda-20l',
      description: 'Ручной пресс для отжима винограда',
      price: 8900,
      stock: 4,
      stockStatus: 'FEW' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-vin001.jpg'],
      categoryId: vinodelcheskoeCategory?.id || '',
      rating: 4.6,
      ratingCount: 3,
    },
    {
      sku: 'VIN002',
      title: 'Дробилка для винограда',
      slug: 'drobilka-dlya-vinograda',
      description: 'Ручная дробилка для винограда',
      price: 4500,
      stock: 6,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-vin002.jpg'],
      categoryId: vinodelcheskoeCategory?.id || '',
      rating: 4.5,
      ratingCount: 5,
    },
    {
      sku: 'VIN003',
      title: 'Бочка для вина дубовая 10л',
      slug: 'bochka-dlya-vina-dubovaya-10l',
      description: 'Дубовая бочка для выдержки вина',
      price: 12500,
      stock: 2,
      stockStatus: 'FEW' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-vin003.jpg'],
      categoryId: vinodelcheskoeCategory?.id || '',
      rating: 4.8,
      ratingCount: 2,
    },
    // Ингредиенты для вина
    {
      sku: 'VING001',
      title: 'Дрожжи винные Red Star Premier Rouge',
      slug: 'drozhzhi-vinnye-red-star-premier-rouge',
      description: 'Французские винные дрожжи',
      price: 280,
      stock: 20,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-ving001.jpg'],
      categoryId: ingredientyVinaCategory?.id || '',
      rating: 4.7,
      ratingCount: 7,
    },
    {
      sku: 'VING002',
      title: 'Винная кислота 100г',
      slug: 'vinnaya-kislota-100g',
      description: 'Винная кислота для регулирования кислотности',
      price: 350,
      stock: 25,
      stockStatus: 'MANY' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-ving002.jpg'],
      categoryId: ingredientyVinaCategory?.id || '',
      rating: 4.4,
      ratingCount: 11,
    },
    {
      sku: 'VING003',
      title: 'Дубильные вещества для вина 50г',
      slug: 'dubilnye-veshchestva-dlya-vina-50g',
      description: 'Дубильные вещества для структуры вина',
      price: 420,
      stock: 18,
      stockStatus: 'ENOUGH' as const,
      badges: [] as const,
      images: ['/uploads/placeholder-ving003.jpg'],
      categoryId: ingredientyVinaCategory?.id || '',
      rating: 4.6,
      ratingCount: 8,
    },
  ]

  // Объединяем все товары
  const allProducts = [...hitProducts, ...newProducts, ...saleProducts, ...additionalProducts]

  // Проверяем наличие категорий
  const defaultCategoryId = pivovareniyeCategory?.id || ingredientyCategory?.id || samogonCategory?.id
  
  if (!defaultCategoryId) {
    console.log('⚠️ Категории не найдены, создание товаров пропущено')
  } else {
    for (const productData of allProducts) {
      // Используем defaultCategoryId если categoryId пустой
      const finalCategoryId = productData.categoryId || defaultCategoryId
      
      if (!finalCategoryId) {
        console.log(`⚠️ Пропущен товар ${productData.sku}: категория не найдена`)
        continue
      }
      
      try {
        // Проверяем существование товара по SKU
        const existingBySku = await prisma.product.findUnique({
          where: { sku: productData.sku },
        })
        
        // Проверяем существование товара по slug
        const existingBySlug = await prisma.product.findUnique({
          where: { slug: productData.slug },
        })
        
        if (existingBySku) {
          // Обновляем существующий товар
          await prisma.product.update({
            where: { sku: productData.sku },
            data: {
              ...productData,
              price: productData.price.toString(),
              oldPrice: productData.oldPrice?.toString(),
              rating: productData.rating?.toString(),
              categoryId: finalCategoryId,
            },
          })
          console.log(`✅ Товар обновлен: ${productData.title}`)
        } else if (existingBySlug) {
          // Если товар с таким slug существует, но SKU другой, создаем с уникальным slug
          const uniqueSlug = `${productData.slug}-${productData.sku.toLowerCase()}`
          await prisma.product.create({
            data: {
              ...productData,
              slug: uniqueSlug,
              price: productData.price.toString(),
              oldPrice: productData.oldPrice?.toString(),
              rating: productData.rating?.toString(),
              categoryId: finalCategoryId,
            },
          })
          console.log(`✅ Товар создан с уникальным slug: ${productData.title}`)
        } else {
          // Создаем новый товар
          await prisma.product.create({
            data: {
              ...productData,
              price: productData.price.toString(),
              oldPrice: productData.oldPrice?.toString(),
              rating: productData.rating?.toString(),
              categoryId: finalCategoryId,
            },
          })
          console.log(`✅ Товар создан: ${productData.title}`)
        }
      } catch (error: any) {
        console.log(`❌ Ошибка при создании товара ${productData.sku}: ${error.message}`)
      }
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
