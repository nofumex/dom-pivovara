import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'dompivovar@mail.ru'
  const password = process.env.ADMIN_PASSWORD || '6SY5I%xIa&2Ez<+'

  console.log(`🔍 Поиск админа с email: ${email}...`)
  
  const admin = await prisma.user.findUnique({
    where: { email },
  })

  if (!admin) {
    console.log(`❌ Админ не найден`)
    return
  }

  console.log(`✅ Админ найден: ${admin.email}`)
  console.log(`\n🔄 Обновление пароля...`)
  
  const hashedPassword = await bcrypt.hash(password, 12)
  
  await prisma.user.update({
    where: { id: admin.id },
    data: { 
      password: hashedPassword,
      updatedAt: new Date(),
    },
  })

  console.log(`✅ Пароль обновлен успешно!`)
  console.log(`\n📋 Данные для входа:`)
  console.log(`   Email: ${email}`)
  console.log(`   Пароль: (из .env)`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

