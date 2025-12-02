# Быстрый старт

## Шаги для запуска проекта

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка базы данных

Создайте PostgreSQL базу данных и заполните `.env` файл:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dom_pivovara?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/dom_pivovara?schema=public"
JWT_SECRET="your-secret-min-32-characters-change-this"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-characters-change-this"
ADMIN_EMAIL="admin@dompivovara.ru"
ADMIN_PASSWORD="admin123"
```

### 3. Применение миграций и заполнение данных

```bash
# Генерация Prisma Client
npm run db:generate

# Применение миграций
npm run db:migrate

# Заполнение начальными данными (создаст админа и тестовые товары)
npm run db:seed
```

### 4. Запуск проекта

```bash
npm run dev
```

Откройте http://localhost:3000

## Доступ к админ-панели

После выполнения `npm run db:seed`:
- URL: http://localhost:3000/admin
- Email: значение из `ADMIN_EMAIL` в `.env` (по умолчанию `admin@dompivovara.ru`)
- Пароль: значение из `ADMIN_PASSWORD` в `.env` (по умолчанию `admin123`)

## Что уже реализовано

✅ Полная структура БД (Prisma)
✅ API для аутентификации (register, login, refresh, logout)
✅ API для товаров и категорий (публичные и админские)
✅ API для заказов
✅ API для админ-панели (аналитика, клиенты, настройки)
✅ Zustand stores (корзина, избранное, сравнение, auth)
✅ Базовые компоненты UI
✅ Стили (SCSS с переменными)
✅ Seed скрипт для начальных данных

## Следующие шаги

1. Доработать UI компоненты согласно frontend_prompt.md
2. Реализовать полный фронтенд (Header, Footer, ProductCard и т.д.)
3. Доработать админ-панель с полным функционалом
4. Добавить обработку изображений
5. Настроить email отправку

## Структура проекта

- `/app` - Next.js страницы и API routes
- `/components` - React компоненты
- `/lib` - Утилиты (auth, db, upload, validation)
- `/prisma` - Схема БД и миграции
- `/store` - Zustand stores
- `/styles` - Глобальные стили

## API Endpoints

### Публичные
- `GET /api/products` - Список товаров с фильтрацией
- `GET /api/products/[slug]` - Товар по slug
- `GET /api/categories` - Категории
- `POST /api/leads` - Создание заявки

### Авторизованные
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Текущий пользователь
- `POST /api/orders` - Создание заказа
- `GET /api/orders` - Список заказов

### Админские
- `GET /api/admin/products` - Управление товарами
- `POST /api/admin/products` - Создание товара
- `PUT /api/admin/products/[slug]` - Обновление товара
- `DELETE /api/admin/products/[slug]` - Удаление товара
- `GET /api/admin/orders` - Управление заказами
- `GET /api/admin/customers` - Управление клиентами
- `GET /api/admin/analytics` - Аналитика

## Важно

- Все API возвращают единый формат: `{ success: boolean, data?: any, error?: string }`
- JWT токены хранятся в cookies (httpOnly)
- Refresh tokens хранятся в БД
- Пароли хешируются через bcrypt (12 rounds)
- Все входные данные валидируются через Zod





