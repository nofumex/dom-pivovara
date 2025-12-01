import { PrismaClient, StockStatus, ProductBadge, OrderStatus, DeliveryType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { allCategories } from '../lib/catalogData'
import { slugify } from '../lib/utils'

const prisma = new PrismaClient()

// Helper function to generate random product data
function generateProduct(
  categoryId: string,
  name: string,
  skuPrefix: string,
  index: number
) {
  const basePrice = Math.floor(Math.random() * 50000) + 100
  const hasOldPrice = Math.random() > 0.7
  const oldPrice = hasOldPrice ? basePrice * 1.3 : null
  const stock = Math.floor(Math.random() * 100)
  const stockStatuses: StockStatus[] = ['MANY', 'ENOUGH', 'FEW', 'NONE']
  const stockStatus = stock > 50 ? 'MANY' : stock > 20 ? 'ENOUGH' : stock > 0 ? 'FEW' : 'NONE'
  const badges: ProductBadge[] = []
  if (Math.random() > 0.7) badges.push('HIT')
  if (Math.random() > 0.8) badges.push('NEW')
  if (hasOldPrice) badges.push('SALE')

  return {
    sku: `${skuPrefix}-${String(index + 1).padStart(3, '0')}`,
    title: name,
    slug: `${slugify(name)}-${index + 1}`,
    description: `Описание товара: ${name}. Качественный продукт для домашнего использования.`,
    price: basePrice.toString(),
    oldPrice: oldPrice ? oldPrice.toString() : null,
    stock,
    stockStatus,
    isActive: true,
    isInStock: stock > 0,
    visibility: 'VISIBLE' as const,
    badges,
    images: [`/uploads/placeholder-${skuPrefix}-${index + 1}.jpg`],
    rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
    ratingCount: Math.floor(Math.random() * 50),
    categoryId,
  }
}

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
      id: randomUUID(),
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Администратор',
      lastName: 'Системы',
      role: 'ADMIN',
      updatedAt: new Date(),
    },
  })

  console.log('✅ Администратор создан:', admin.email)

  // Создание гостевого пользователя для неавторизованных заказов
  const guestUser = await prisma.user.upsert({
    where: { email: 'guest@system.local' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'guest@system.local',
      password: await bcrypt.hash('guest', 12),
      firstName: 'Гость',
      lastName: 'Система',
      role: 'CUSTOMER',
      updatedAt: new Date(),
    },
  })
  console.log('✅ Гостевой пользователь создан:', guestUser.email)

  // Создание тестовых пользователей
  const testUsers = [
    {
      email: 'user@test.ru',
      password: 'user123',
      firstName: 'Тестовый',
      lastName: 'Пользователь',
      role: 'CUSTOMER' as const,
    },
  ]

  const createdUsers = [admin]
  for (const userData of testUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        id: randomUUID(),
        ...userData,
        password: hashedPassword,
        updatedAt: new Date(),
      },
    })
    createdUsers.push(user)
    console.log(`✅ Тестовый пользователь создан: ${userData.email} (пароль: ${userData.password})`)
  }

  // Создание всех категорий из catalogData
  console.log('📁 Создание категорий...')
  const categoryMap = new Map<string, string>() // slug -> id
  const subcategoryMap = new Map<string, string>() // slug -> id
  const subSubcategoryMap = new Map<string, string>() // slug -> id

  let sortOrder = 0

  for (const categoryData of allCategories) {
    // Создаем главную категорию
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {
        name: categoryData.name,
        sortOrder: sortOrder++,
      },
      create: {
        id: randomUUID(),
        name: categoryData.name,
        slug: categoryData.slug,
        description: `Категория: ${categoryData.name}`,
        sortOrder: sortOrder++,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    categoryMap.set(categoryData.slug, category.id)
    console.log(`✅ Категория создана: ${category.name}`)

    // Создаем подкатегории
    let subSortOrder = 0
    for (const subcategoryData of categoryData.subcategories) {
      const subcategory = await prisma.category.upsert({
        where: { slug: subcategoryData.slug },
        update: {
          name: subcategoryData.name,
          parentId: category.id,
          sortOrder: subSortOrder++,
        },
        create: {
          id: randomUUID(),
          name: subcategoryData.name,
          slug: subcategoryData.slug,
          description: `Подкатегория: ${subcategoryData.name}`,
          parentId: category.id,
          sortOrder: subSortOrder++,
          isActive: true,
          updatedAt: new Date(),
        },
      })
      subcategoryMap.set(subcategoryData.slug, subcategory.id)

      // Создаем под-подкатегории
      if (subcategoryData.subSubcategories) {
        let subSubSortOrder = 0
        for (const subSubcategoryData of subcategoryData.subSubcategories) {
          const subSubcategory = await prisma.category.upsert({
            where: { slug: subSubcategoryData.slug },
            update: {
              name: subSubcategoryData.name,
              parentId: subcategory.id,
              sortOrder: subSubSortOrder++,
            },
            create: {
              id: randomUUID(),
              name: subSubcategoryData.name,
              slug: subSubcategoryData.slug,
              description: `Под-подкатегория: ${subSubcategoryData.name}`,
              parentId: subcategory.id,
              sortOrder: subSubSortOrder++,
              isActive: true,
              updatedAt: new Date(),
            },
          })
          subSubcategoryMap.set(subSubcategoryData.slug, subSubcategory.id)
        }
      }
    }
  }

  console.log(`✅ Создано категорий: ${categoryMap.size}, подкатегорий: ${subcategoryMap.size}, под-подкатегорий: ${subSubcategoryMap.size}`)

  // Создание товаров для каждой категории/подкатегории/под-подкатегории
  console.log('📦 Создание товаров...')
  let productCount = 0

  // Функция для добавления товаров в категорию
  async function addProductsToCategory(
    categoryId: string,
    categoryName: string,
    count: number = 2,
    categorySlug?: string
  ) {
    for (let i = 0; i < count; i++) {
      const productName = `${categoryName} - Товар ${i + 1}`
      // Используем slug категории для уникальности SKU
      const skuPrefix = (categorySlug || categoryName.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X') || 'PRD').substring(0, 6).toUpperCase()
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      try {
        const baseProductData = generateProduct(categoryId, productName, skuPrefix, i)
        
        // Делаем SKU и slug уникальными
        const uniqueSku = `${skuPrefix}-${uniqueId.substring(0, 8).toUpperCase()}`
        const uniqueSlug = `${slugify(categoryName)}-tovar-${i + 1}-${uniqueId.substring(0, 6)}`
        
        const productData = {
          ...baseProductData,
          sku: uniqueSku,
          slug: uniqueSlug,
        }
        
        // Проверяем существование по SKU и slug
        const existingBySku = await prisma.product.findUnique({
          where: { sku: productData.sku },
        })
        
        const existingBySlug = await prisma.product.findUnique({
          where: { slug: productData.slug },
        })
        
        if (!existingBySku && !existingBySlug) {
          await prisma.product.create({
            data: {
              ...productData,
              id: randomUUID(),
              updatedAt: new Date(),
              stockStatus: productData.stockStatus as StockStatus,
            },
          })
          productCount++
          if (productCount % 10 === 0) {
            console.log(`   Создано товаров: ${productCount}...`)
          }
        } else {
          // Если конфликт, пробуем еще раз с другим уникальным ID
          const retryId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          const retrySku = `${skuPrefix}-${retryId.substring(0, 8).toUpperCase()}`
          const retrySlug = `${slugify(categoryName)}-tovar-${i + 1}-${retryId.substring(0, 6)}`
          
          const retryProductData = {
            ...baseProductData,
            sku: retrySku,
            slug: retrySlug,
          }
          
          const retryExistingBySku = await prisma.product.findUnique({
            where: { sku: retryProductData.sku },
          })
          
          const retryExistingBySlug = await prisma.product.findUnique({
            where: { slug: retryProductData.slug },
          })
          
          if (!retryExistingBySku && !retryExistingBySlug) {
            await prisma.product.create({
              data: {
                ...retryProductData,
                id: randomUUID(),
                updatedAt: new Date(),
                stockStatus: retryProductData.stockStatus as StockStatus,
              },
            })
            productCount++
            if (productCount % 10 === 0) {
              console.log(`   Создано товаров: ${productCount}...`)
            }
          }
        }
      } catch (error: any) {
        console.log(`⚠️ Ошибка при создании товара для ${categoryName}: ${error.message}`)
        console.log(`   Детали ошибки:`, error)
      }
    }
  }

  // Добавляем товары во все категории
  console.log('   Добавление товаров в основные категории...')
  for (const categoryData of allCategories) {
    const categoryId = categoryMap.get(categoryData.slug)
    if (categoryId) {
      await addProductsToCategory(categoryId, categoryData.name, 2, categoryData.slug)
    }
  }

  console.log('   Добавление товаров в подкатегории...')
  // Добавляем товары в подкатегории
  for (const categoryData of allCategories) {
    for (const subcategoryData of categoryData.subcategories) {
      const subcategoryId = subcategoryMap.get(subcategoryData.slug)
      if (subcategoryId) {
        await addProductsToCategory(subcategoryId, subcategoryData.name, 2, subcategoryData.slug)
      }
    }
  }

  console.log('   Добавление товаров в под-подкатегории...')
  // Добавляем товары в под-подкатегории
  for (const categoryData of allCategories) {
    for (const subcategoryData of categoryData.subcategories) {
      if (subcategoryData.subSubcategories) {
        for (const subSubcategoryData of subcategoryData.subSubcategories) {
          const subSubcategoryId = subSubcategoryMap.get(subSubcategoryData.slug)
          if (subSubcategoryId) {
            await addProductsToCategory(subSubcategoryId, subSubcategoryData.name, 1, subSubcategoryData.slug)
          }
        }
      }
    }
  }

  console.log(`✅ Создано товаров: ${productCount}`)

  // Создание тестовых заказов
  console.log('🛒 Создание тестовых заказов...')
  const products = await prisma.product.findMany({
    where: { isActive: true, visibility: 'VISIBLE' },
    take: 20,
  })

  if (products.length > 0 && createdUsers.length > 0) {
    const customer = createdUsers.find(u => u.role === 'CUSTOMER') || createdUsers[0]
    
    for (let i = 0; i < 10; i++) {
      const orderNumber = `ORD-${String(Date.now()).slice(-8)}-${String(i + 1).padStart(3, '0')}`
      const selectedProducts = products.slice(0, Math.floor(Math.random() * 5) + 1)
      
      let subtotal = 0
      const orderItems = selectedProducts.map((product) => {
        const quantity = Math.floor(Math.random() * 3) + 1
        const price = Number(product.price)
        const total = price * quantity
        subtotal += total
        return {
          productId: product.id,
          quantity,
          price: price.toString(),
          total: total.toString(),
        }
      })

      const delivery = Math.floor(Math.random() * 500) + 100
      const discount = Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0
      const total = subtotal + delivery - discount

      const statuses: OrderStatus[] = ['NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const deliveryTypes: DeliveryType[] = ['PICKUP', 'COURIER', 'TRANSPORT']
      const deliveryType = deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)]

      try {
        const order = await prisma.order.create({
            data: {
            id: randomUUID(),
            orderNumber,
            userId: customer.id,
            status,
            total: total.toString(),
            subtotal: subtotal.toString(),
            delivery: delivery.toString(),
            discount: discount.toString(),
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone || '+7 999 123-45-67',
            deliveryType,
            updatedAt: new Date(),
            OrderItem: {
              create: orderItems.map(item => ({
                ...item,
                id: randomUUID(),
              })),
            },
          },
        })
        console.log(`✅ Заказ создан: ${order.orderNumber}`)
      } catch (error: any) {
        console.log(`⚠️ Ошибка при создании заказа: ${error.message}`)
      }
    }
  }

  // Создание расширенных настроек
  console.log('⚙️ Создание настроек...')
  const settings = [
    // Контакты
    { key: 'contactEmail', value: 'info@dompivovara.ru', type: 'STRING' as const },
    { key: 'contactPhone', value: '+7 913 555-222-6', type: 'STRING' as const },
    { key: 'contactPhone2', value: '+7 913 555-222-7', type: 'STRING' as const },
    { key: 'address', value: 'г. Москва, ул. Примерная, д. 1', type: 'STRING' as const },
    { key: 'workingHours', value: 'Пн-Пт: 9:00-18:00, Сб-Вс: 10:00-16:00', type: 'STRING' as const },
    
    // Социальные сети
    {
      key: 'socialLinks',
      value: JSON.stringify([
        { label: 'VK', url: 'https://vk.com/dompivovara' },
        { label: 'YouTube', url: 'https://youtube.com/@dompivovara' },
        { label: 'Telegram', url: 'https://t.me/dompivovara' },
        { label: 'Instagram', url: 'https://instagram.com/dompivovara' },
      ]),
      type: 'JSON' as const,
    },
    
    // Заказы
    { key: 'minOrderTotal', value: '1000', type: 'NUMBER' as const },
    { key: 'freeDeliveryThreshold', value: '5000', type: 'NUMBER' as const },
    { key: 'deliveryPrice', value: '500', type: 'NUMBER' as const },
    
    // Сайт
    { key: 'siteName', value: 'Дом Пивовара', type: 'STRING' as const },
    { key: 'siteDescription', value: 'Интернет-магазин товаров для пивоварения, самогоноварения и виноделия', type: 'STRING' as const },
    { key: 'currency', value: 'RUB', type: 'STRING' as const },
    { key: 'currencySymbol', value: '₽', type: 'STRING' as const },
    
    // Email настройки
    {
      key: 'emailSettings',
      value: JSON.stringify({
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: 'noreply@dompivovara.ru',
        smtpPassword: '',
        fromEmail: 'noreply@dompivovara.ru',
        fromName: 'Дом Пивовара',
        companyEmail: 'info@dompivovara.ru',
      }),
      type: 'JSON' as const,
    },
    
    // Попап
    { key: 'popupEnabled', value: 'false', type: 'BOOLEAN' as const },
    { key: 'popupTitle', value: 'Специальное предложение!', type: 'STRING' as const },
    { key: 'popupText', value: 'Получите скидку 10% на первый заказ', type: 'STRING' as const },
    { key: 'popupButtonLabel', value: 'Получить скидку', type: 'STRING' as const },
    { key: 'popupButtonUrl', value: '/catalog', type: 'STRING' as const },
    { key: 'popupDelaySeconds', value: '5', type: 'NUMBER' as const },
    
    // SEO
    { key: 'seoTitle', value: 'Дом Пивовара - Товары для пивоварения, самогоноварения и виноделия', type: 'STRING' as const },
    { key: 'seoDescription', value: 'Широкий ассортимент товаров для домашнего пивоварения, самогоноварения и виноделия. Доставка по всей России.', type: 'STRING' as const },
    { key: 'seoKeywords', value: 'пивоварение, самогоноварение, виноделие, товары для пивоварения', type: 'STRING' as const },
    
    // Слайдер
    { key: 'heroSliderInterval', value: '5000', type: 'NUMBER' as const },
    
    // Дополнительные контакты
    {
      key: 'extraContacts',
      value: JSON.stringify([
        { title: 'Отдел продаж', values: ['+7 913 555-222-6', 'sales@dompivovara.ru'] },
        { title: 'Техническая поддержка', values: ['+7 913 555-222-7', 'support@dompivovara.ru'] },
        { title: 'Оптовые заказы', values: ['+7 913 555-222-8', 'wholesale@dompivovara.ru'] },
      ]),
      type: 'JSON' as const,
    },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, type: setting.type },
      create: {
        ...setting,
        id: randomUUID(),
      },
    })
  }

  console.log(`✅ Создано настроек: ${settings.length}`)

  // Создание тестовых слайдов для hero секции
  console.log('🖼️ Создание слайдов...')
  const heroSlides = [
    {
      url: 'https://images.unsplash.com/photo-1608270586621-1a7b4abc5e2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=450&q=80',
      alt: 'Пивоварение',
      title: 'Акция',
      text: 'Специальные предложения на товары для пивоварения',
      buttonText: 'Подробнее об акции',
      buttonUrl: '/sales',
      order: 0,
      isActive: true,
    },
    {
      url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=450&q=80',
      alt: 'Самогоноварение',
      title: 'Новинки',
      text: 'Новое оборудование для самогоноварения',
      buttonText: 'Смотреть каталог',
      buttonUrl: '/catalog',
      order: 1,
      isActive: true,
    },
    {
      url: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=450&q=80',
      alt: 'Виноделие',
      title: 'Виноделие',
      text: 'Все необходимое для домашнего виноделия',
      buttonText: 'Перейти в каталог',
      buttonUrl: '/catalog/vinodeliye',
      order: 2,
      isActive: true,
    },
  ]

  // Создаем слайды по порядку
  for (let i = 0; i < heroSlides.length; i++) {
    const slideData = heroSlides[i]
    // Ищем существующий слайд с таким же порядком или создаем новый
    const existing = await prisma.heroImage.findFirst({
      where: { order: slideData.order },
    })

    if (existing) {
      await prisma.heroImage.update({
        where: { id: existing.id },
        data: {
          ...slideData,
          updatedAt: new Date(),
        },
      })
    } else {
      await prisma.heroImage.create({
        data: {
          ...slideData,
          id: randomUUID(),
          updatedAt: new Date(),
        },
      })
    }
  }
  console.log(`✅ Создано слайдов: ${heroSlides.length}`)

  console.log('🎉 Заполнение базы данных завершено!')
  console.log(`📊 Статистика:`)
  console.log(`   - Категорий: ${categoryMap.size}`)
  console.log(`   - Подкатегорий: ${subcategoryMap.size}`)
  console.log(`   - Под-подкатегорий: ${subSubcategoryMap.size}`)
  console.log(`   - Товаров: ${productCount}`)
  console.log(`   - Пользователей: ${createdUsers.length}`)
  console.log(`   - Настроек: ${settings.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
