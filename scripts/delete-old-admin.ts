import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const newAdminEmail = process.env.ADMIN_EMAIL || 'dompivovar@mail.ru'
  const newAdminPassword = process.env.ADMIN_PASSWORD || '6SY5I%xIa&2Ez<+'

  console.log(`🎯 Целевой админ: ${newAdminEmail}`)
  console.log('🔍 Поиск всех админских аккаунтов...')
  
  // Находим всех админов
  const allAdmins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
  })

  console.log(`Найдено админов: ${allAdmins.length}`)
  allAdmins.forEach(admin => {
    console.log(`  - ${admin.email} (ID: ${admin.id})`)
  })

  // Проверяем, существует ли админ с новым email
  let targetAdmin = await prisma.user.findUnique({
    where: { email: newAdminEmail },
  })

  // Если админ с новым email не существует, обновляем email первого найденного админа
  if (!targetAdmin && allAdmins.length > 0) {
    console.log(`\n🔄 Обновление email админа с ${allAdmins[0].email} на ${newAdminEmail}...`)
    targetAdmin = await prisma.user.update({
      where: { id: allAdmins[0].id },
      data: {
        email: newAdminEmail,
      },
    })
    console.log(`✅ Email админа обновлен`)
  }

  // Удаляем остальных админов, если есть (кроме того, что с новым email)
  if (allAdmins.length > 1 || (allAdmins.length === 1 && allAdmins[0].email !== newAdminEmail)) {
    console.log(`\n🗑️  Удаление дополнительных админских аккаунтов...`)
    const adminsToDelete = allAdmins.filter(a => a.email !== newAdminEmail)
    
    // Не можем удалить через deleteMany из-за foreign key, поэтому обновляем их роль
    // Но лучше просто обновить email и пароль, и оставить одного
    console.log(`⚠️  Пропускаем удаление из-за связей с заказами. Обновляем только целевого админа.`)
  }

  // Обновляем пароль целевого админа
  if (targetAdmin) {
    console.log(`\n🔄 Обновление пароля админа: ${targetAdmin.email}`)
    const hashedPassword = await bcrypt.hash(newAdminPassword, 12)

    const updatedAdmin = await prisma.user.update({
      where: { email: newAdminEmail },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    })

    console.log(`✅ Пароль админа обновлен`)
  } else {
    // Создаем нового админа, если не существует
    console.log(`\n➕ Создание нового админа: ${newAdminEmail}`)
    const hashedPassword = await bcrypt.hash(newAdminPassword, 12)

    const newAdmin = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: newAdminEmail,
        password: hashedPassword,
        firstName: 'Администратор',
        lastName: 'Системы',
        role: 'ADMIN',
        updatedAt: new Date(),
      },
    })

    console.log(`✅ Новый админ создан: ${newAdmin.email}`)
  }

  // Финальная проверка
  console.log(`\n📋 Финальный список админов:`)
  const finalAdmins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
  })
  finalAdmins.forEach(admin => {
    console.log(`  - ${admin.email} (ID: ${admin.id})`)
  })

  if (finalAdmins.length === 1 && finalAdmins[0].email === newAdminEmail) {
    console.log(`\n✅ Готово! Остался только один админ с правильным email и паролем: ${newAdminEmail}`)
  } else {
    console.log(`\n⚠️  Внимание: В базе осталось ${finalAdmins.length} админов.`)
    console.log(`   Целевой админ: ${newAdminEmail}`)
  }
}

main()
  .catch((e) => {
    console.error('Ошибка:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
