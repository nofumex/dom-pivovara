# Настройка переменных окружения

## Быстрая настройка

1. Скопируйте файл `env.example` в `.env`:
```bash
# Windows (PowerShell)
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```

2. Откройте `.env` и заполните следующие обязательные переменные:

### Обязательные переменные

```env
# База данных PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/dom_pivovara?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/dom_pivovara?schema=public"

# JWT секреты (минимум 32 символа каждый!)
JWT_SECRET="your-jwt-secret-min-32-characters-change-in-production"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-min-32-characters-change-in-production"
```

### Пример заполнения

```env
# База данных (замените user, password, localhost, 5432 на ваши значения)
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/dom_pivovara?schema=public"
DIRECT_URL="postgresql://postgres:mypassword@localhost:5432/dom_pivovara?schema=public"

# JWT секреты (сгенерируйте случайные строки минимум 32 символа)
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
JWT_REFRESH_SECRET="z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4"

# Остальные переменные можно оставить по умолчанию или изменить
ADMIN_EMAIL="admin@dompivovara.ru"
ADMIN_PASSWORD="admin123"
```

### Опциональные переменные

Эти переменные можно настроить позже или оставить по умолчанию:

- `SMTP_*` - для отправки email (настраивается в админ-панели)
- `UPLOAD_DIR` - директория для загрузки файлов (по умолчанию `./public/uploads`)
- `MAX_FILE_SIZE` - максимальный размер файла в байтах (по умолчанию 5MB)
- `SITE_URL` - URL сайта (по умолчанию `http://localhost:3000`)
- `SITE_NAME` - название сайта
- `ADMIN_EMAIL` - email администратора (создается при seed)
- `ADMIN_PASSWORD` - пароль администратора (создается при seed)

## Генерация JWT секретов

Для генерации безопасных JWT секретов можно использовать:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

Или используйте онлайн генератор случайных строк (минимум 32 символа).

## Проверка настроек

После заполнения `.env` файла:

1. Убедитесь, что PostgreSQL запущен
2. Проверьте подключение к БД
3. Запустите миграции:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Важно!

- **НЕ коммитьте `.env` файл в git** (он уже в `.gitignore`)
- **Измените JWT секреты в production** на уникальные значения
- **Используйте сильные пароли** для базы данных и администратора


