import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const email = 'dompivovar@mail.ru'
  // Явно указываем пароль, чтобы избежать проблем с чтением из .env
  const password = '6SY5I%xIa&2Ez<+'

  console.log(`🔍 Поиск существующего админа...`)
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  })

  if (existingAdmin) {
    console.log(`✅ Админ найден: ${existingAdmin.email}`)
    console.log(`🔄 Обновление пароля...`)
    
    const hashedPassword = await bcrypt.hash(password, 12)
    
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    })
    
    console.log(`✅ Пароль обновлен!`)
  } else {
    console.log(`➕ Создание нового админа...`)
    
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const admin = await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        password: hashedPassword,
        firstName: 'Администратор',
        lastName: 'Системы',
        role: 'ADMIN',
        updatedAt: new Date(),
      },
    })
    
    console.log(`✅ Админ создан: ${admin.email}`)
  }

  // Проверяем пароль - пробуем захешировать и сравнить
  console.log(`\n🔐 Проверка пароля...`)
  const testHash = await bcrypt.hash(password, 12)
  console.log(`   Хеш пароля сгенерирован: ${testHash.substring(0, 20)}...`)
  
  const finalAdmin = await prisma.user.findUnique({
    where: { email },
  })
  
  if (finalAdmin) {
    const isValid = await bcrypt.compare(password, finalAdmin.password)
    console.log(`   Проверка пароля: ${isValid ? '✅ ВЕРНО' : '❌ НЕВЕРНО'}`)
  }

  console.log(`\n📋 Данные для входа:`)
  console.log(`   Email: ${email}`)
  console.log(`   Пароль: ${password}`)
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

