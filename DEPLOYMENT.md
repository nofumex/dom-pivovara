# Инструкция по развертыванию

## Требования

- Node.js 18+
- PostgreSQL 15+
- npm или pnpm

## Шаги развертывания

### 1. Клонирование и установка

```bash
# Установка зависимостей
npm install
```

### 2. Настройка базы данных

1. Создайте PostgreSQL базу данных:
```sql
CREATE DATABASE dom_pivovara;
```

2. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

3. Заполните переменные окружения в `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dom_pivovara?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/dom_pivovara?schema=public"
JWT_SECRET="your-secret-min-32-characters"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-characters"
```

### 3. Применение миграций

```bash
# Генерация Prisma Client
npm run db:generate

# Применение миграций
npm run db:migrate

# Заполнение начальными данными
npm run db:seed
```

### 4. Запуск

```bash
# Разработка
npm run dev

# Production
npm run build
npm start
```

## Проверка работы

1. Откройте `http://localhost:3000` - главная страница
2. Откройте `http://localhost:3000/admin` - админ-панель
3. Войдите с учетными данными из `.env` (ADMIN_EMAIL и ADMIN_PASSWORD)

## Структура проекта

- `/app` - Next.js страницы и API routes
- `/components` - React компоненты
- `/lib` - Утилиты и сервисы
- `/prisma` - Схема БД и миграции
- `/store` - Zustand stores
- `/styles` - Глобальные стили

## API Endpoints

### Публичные
- `GET /api/products` - Список товаров
- `GET /api/products/[slug]` - Товар
- `GET /api/categories` - Категории
- `POST /api/leads` - Создание заявки

### Авторизованные
- `POST /api/orders` - Создание заказа
- `GET /api/orders` - Список заказов

### Админские
- `GET /api/admin/products` - Управление товарами
- `GET /api/admin/orders` - Управление заказами
- `GET /api/admin/customers` - Управление клиентами
- `GET /api/admin/analytics` - Аналитика

## Важные замечания

1. **JWT секреты**: Обязательно измените JWT_SECRET и JWT_REFRESH_SECRET на уникальные значения в production
2. **База данных**: Убедитесь, что PostgreSQL запущен и доступен
3. **Загрузка файлов**: Создайте директорию `public/uploads` если её нет
4. **Email**: Настройте SMTP в админ-панели для отправки писем

