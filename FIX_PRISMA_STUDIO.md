# Решение проблемы: Prisma Studio показывает 0 записей

## Проблема
- Данные ЕСТЬ в базе (проверено через psql direct connection)
- Prisma Studio показывает 0 записей
- Возможно проблема с Neon branches или pooled connection

## Решение 1: Использовать Direct Connection для Prisma Studio (временно)

Временно измените `.env` для Prisma Studio:

```env
# Временно используем direct connection для проверки
DATABASE_URL="postgresql://neondb_owner:npg_aEouTH2edw8m@ep-long-bush-a10bntmc.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:npg_aEouTH2edw8m@ep-long-bush-a10bntmc.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

Затем:
```powershell
npm run db:studio
```

Если данные появятся - значит проблема в pooled connection/branch.

## Решение 2: Проверить Neon Branches

1. Откройте https://console.neon.tech
2. Выберите проект
3. Проверьте раздел **Branches**
4. Убедитесь, что:
   - Pooled connection указывает на правильный branch
   - Direct connection указывает на тот же branch
   - Данные были восстановлены в правильный branch

## Решение 3: Восстановить данные в правильный branch

Если данные в другом branch:
1. Убедитесь, что используете connection strings из **main branch** (или нужного вам branch)
2. Получите connection strings из правильного branch
3. Обновите `.env`
4. При необходимости восстановите данные заново

## Решение 4: Использовать Direct Connection везде (для разработки)

Для разработки можно использовать direct connection везде:

```env
DATABASE_URL="postgresql://neondb_owner:npg_aEouTH2edw8m@ep-long-bush-a10bntmc.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:npg_aEouTH2edw8m@ep-long-bush-a10bntmc.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

⚠️ В production используйте pooled connection для DATABASE_URL!

