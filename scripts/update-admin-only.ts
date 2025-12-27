import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@dompivovara.ru'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  console.log(`Обновление администратора: ${adminEmail}`)

  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  // Обновляем или создаем только администратора
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      updatedAt: new Date(),
    },
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

  console.log(`✅ Администратор обновлен: ${admin.email}`)
  console.log(`✅ Роль: ${admin.role}`)
}

main()
  .catch((e) => {
    console.error('Ошибка:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

