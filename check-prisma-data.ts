// Скрипт для проверки данных через Prisma Client
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('Проверка данных через Prisma Client...\n')
    
    const userCount = await prisma.user.count()
    const categoryCount = await prisma.category.count()
    const productCount = await prisma.product.count()
    const orderCount = await prisma.order.count()
    
    console.log('User:', userCount)
    console.log('Category:', categoryCount)
    console.log('Product:', productCount)
    console.log('Order:', orderCount)
    
    if (userCount > 0 || categoryCount > 0 || productCount > 0 || orderCount > 0) {
      console.log('\n✅ Данные есть в базе!')
    } else {
      console.log('\n❌ Данных нет в базе (или Prisma подключается к другой БД)')
    }
  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()















