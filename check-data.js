// Простая проверка через Prisma
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Проверка данных...\n')
    
    const userCount = await prisma.user.count()
    const categoryCount = await prisma.category.count()
    const productCount = await prisma.product.count()
    const orderCount = await prisma.order.count()
    
    console.log('User:', userCount)
    console.log('Category:', categoryCount)
    console.log('Product:', productCount)
    console.log('Order:', orderCount)
    
    if (userCount > 0 || categoryCount > 0 || productCount > 0 || orderCount > 0) {
      console.log('\n✅ Данные ЕСТЬ в базе через Prisma Client!')
    } else {
      console.log('\n❌ Данных НЕТ - возможно проблема с подключением')
    }
  } catch (error) {
    console.error('Ошибка:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()














