import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'dompivovar@mail.ru'
  const password = process.env.ADMIN_PASSWORD || '6SY5I%xIa&2Ez<+'

  console.log(`🔍 Проверка существующих админов...`)
  const existingAdmins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
  })

  if (existingAdmins.length > 0) {
    console.log(`⚠️  Найдено существующих админов: ${existingAdmins.length}`)
    existingAdmins.forEach(admin => {
      console.log(`   - ${admin.email}`)
    })
    console.log(`\n❌ Админы уже существуют. Удалите их сначала через SQL.`)
    return
  }

  console.log(`\n➕ Создание нового админа...`)
  console.log(`   Email: ${email}`)
  
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
  
  console.log(`\n✅ Админ успешно создан!`)
  console.log(`   ID: ${admin.id}`)
  console.log(`   Email: ${admin.email}`)
  console.log(`   Роль: ${admin.role}`)
  console.log(`\n✅ Теперь вы можете войти с email: ${email}`)
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

