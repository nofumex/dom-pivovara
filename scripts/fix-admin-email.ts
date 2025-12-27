import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const correctEmail = 'dompivovar@mail.ru' // Правильный email из .env
  
  console.log(`🔍 Поиск админов...`)
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
  })

  if (admins.length === 0) {
    console.log(`❌ Админы не найдены`)
    return
  }

  admins.forEach(admin => {
    console.log(`   Найден админ: ${admin.email}`)
  })

  // Обновляем email первого админа на правильный
  if (admins[0].email !== correctEmail) {
    console.log(`\n🔄 Обновление email с ${admins[0].email} на ${correctEmail}...`)
    
    const updated = await prisma.user.update({
      where: { id: admins[0].id },
      data: { email: correctEmail },
    })

    console.log(`✅ Email обновлен на: ${updated.email}`)
  } else {
    console.log(`\n✅ Email уже правильный: ${correctEmail}`)
  }

  // Проверяем финальный результат
  const finalAdmins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
  })
  console.log(`\n📋 Финальный список админов:`)
  finalAdmins.forEach(admin => {
    console.log(`   - ${admin.email} (ID: ${admin.id})`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
