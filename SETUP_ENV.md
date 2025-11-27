# Быстрая настройка .env файла

## Шаг 1: Создайте файл .env

Скопируйте `env.example` в `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item env.example .env
```

**Windows (CMD):**
```cmd
copy env.example .env
```

**Linux/Mac:**
```bash
cp env.example .env
```

## Шаг 2: Откройте .env и заполните ОБЯЗАТЕЛЬНЫЕ переменные

### Минимальная конфигурация для запуска:

```env
# База данных PostgreSQL (ОБЯЗАТЕЛЬНО!)
# Замените user, password, localhost, 5432 на ваши реальные значения
DATABASE_URL="postgresql://postgres:ваш_пароль@localhost:5432/dom_pivovara?schema=public"

# JWT секреты (ОБЯЗАТЕЛЬНО! Минимум 32 символа каждый)
# Сгенерируйте случайные строки:
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
JWT_REFRESH_SECRET="z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4"
```

### Пример для локальной разработки:

```env
# Если PostgreSQL на localhost с пользователем postgres и паролем postgres
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dom_pivovara?schema=public"

# JWT секреты (можно использовать эти для разработки, но ОБЯЗАТЕЛЬНО измените в production!)
JWT_SECRET="dev-secret-key-min-32-characters-long-12345678901234567890"
JWT_REFRESH_SECRET="dev-refresh-secret-min-32-characters-long-09876543210987654321"
```

## Шаг 3: Проверьте, что файл создан правильно

Убедитесь, что:
1. Файл называется именно `.env` (с точкой в начале)
2. В файле есть `DATABASE_URL` и `JWT_SECRET`, `JWT_REFRESH_SECRET`
3. Значения в кавычках (если содержат специальные символы)

## Шаг 4: Запустите миграции

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Генерация JWT секретов

Если нужно сгенерировать случайные секреты:

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

## Проверка подключения к БД

Убедитесь, что:
1. PostgreSQL запущен
2. База данных `dom_pivovara` создана (или будет создана автоматически)
3. Пользователь имеет права на создание базы данных

## Если ошибка все еще возникает

1. Проверьте, что файл `.env` находится в корне проекта (там же, где `package.json`)
2. Перезапустите терминал после создания `.env`
3. Убедитесь, что в `.env` нет лишних пробелов или символов


