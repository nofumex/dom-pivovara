# Исправление проблемы Connection Pool Timeout в Neon

## Проблема
```
Timed out fetching a new connection from the connection pool. 
Connection pool timeout: 10, connection limit: 5
```

## Решение

### Вариант 1: Добавить параметры connection_limit в connection string (Рекомендуется)

Обновите `.env` файл, добавив параметры для управления connection pool:

```env
# Pooled connection с параметрами для Neon
DATABASE_URL="postgresql://neondb_owner:npg_aEouTH2edw8m@ep-long-bush-a10bntmc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connection_limit=1&pool_timeout=20"

# Direct connection (без изменений)
DIRECT_URL="postgresql://neondb_owner:npg_aEouTH2edw8m@ep-long-bush-a10bntmc.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

**Параметры:**
- `connection_limit=1` - ограничивает количество одновременных подключений (для Neon pooled connection рекомендуется 1)
- `pool_timeout=20` - увеличивает timeout до 20 секунд

### Вариант 2: Использовать direct connection для разработки (Временно)

Если проблема сохраняется, временно используйте direct connection:

```env
# Временно для разработки - используем direct connection
DATABASE_URL="postgresql://neondb_owner:npg_aEouTH2edw8m@ep-long-bush-a10bntmc.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:npg_aEouTH2edw8m@ep-long-bush-a10bntmc.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

⚠️ **Для production всегда используйте pooled connection!**

### Вариант 3: Оптимизировать использование Prisma Client

Убедитесь, что вы не создаете множественные экземпляры PrismaClient. Используйте singleton паттерн (уже реализовано в `lib/db.ts`).

## После изменений

1. Перезапустите dev server:
```powershell
# Остановите (Ctrl+C)
# Запустите заново:
npm run dev
```

2. Проверьте, что ошибка исчезла.

## Дополнительная информация

- Neon connection pooler имеет ограничение на количество одновременных подключений
- Для serverless окружений рекомендуется `connection_limit=1`
- Direct connection не имеет этого ограничения, но менее эффективен для serverless












