# ДомПивовар - Интернет-магазин

Production-ready интернет-магазин для товаров пивоварения, самогоноварения и сопутствующих товаров.

## Технологический стек

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, SCSS Modules
- **Backend**: Next.js API Routes, Prisma ORM
- **База данных**: PostgreSQL
- **State Management**: Zustand
- **Аутентификация**: JWT (access + refresh tokens)
- **Валидация**: Zod, React Hook Form

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных

1. Создайте PostgreSQL базу данных
2. Скопируйте `.env.example` в `.env`
3. Заполните `DATABASE_URL` и `DIRECT_URL` в `.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dom_pivovara?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/dom_pivovara?schema=public"
```

### 3. Настройка JWT секретов

В `.env` укажите секреты для JWT (минимум 32 символа):

```env
JWT_SECRET="your-jwt-secret-min-32-characters"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-min-32-characters"
```

### 4. Применение миграций и заполнение данных

```bash
# Генерация Prisma Client
npm run db:generate

# Применение миграций
npm run db:migrate

# Заполнение начальными данными (создаст админа и тестовые товары)
npm run db:seed
```

### 5. Запуск проекта

```bash
# Разработка
npm run dev

# Production
npm run build
npm start
```

## Доступ к админ-панели

После выполнения `npm run db:seed` будет создан администратор:

- **Email**: `admin@dompivovara.ru` (или значение из `ADMIN_EMAIL` в `.env`)
- **Пароль**: `admin123` (или значение из `ADMIN_PASSWORD` в `.env`)

Админ-панель доступна по адресу: `http://localhost:3000/admin`

## Структура проекта

```
/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   ├── admin/              # Админ-панель
│   ├── (public)/           # Публичные страницы
│   └── layout.tsx          # Корневой layout
├── components/              # React компоненты
│   ├── atoms/              # Атомарные компоненты
│   ├── molecules/          # Молекулярные компоненты
│   └── organisms/          # Организмы (сложные компоненты)
├── lib/                     # Утилиты и сервисы
│   ├── auth.ts             # Аутентификация
│   ├── db.ts               # Prisma Client
│   └── utils.ts            # Вспомогательные функции
├── prisma/                  # Prisma схема и миграции
│   ├── schema.prisma       # Схема БД
│   └── seed.ts             # Seed скрипт
├── store/                   # Zustand stores
├── styles/                  # Глобальные стили
└── types/                   # TypeScript типы
```

## Основные функции

### Публичная часть
- Каталог товаров с фильтрацией и сортировкой
- Страницы категорий и подкатегорий
- Карточки товаров с детальной информацией
- Корзина, избранное, сравнение товаров
- Поиск по товарам
- Оформление заказов
- Профиль пользователя
- Отзывы и рейтинги

### Админ-панель
- Управление товарами (CRUD)
- Управление категориями
- Управление заказами
- Управление клиентами
- Аналитика и статистика
- Настройки сайта
- Импорт/экспорт данных

## API Endpoints

### Публичные
- `GET /api/products` - Список товаров
- `GET /api/products/[slug]` - Товар по slug
- `GET /api/categories` - Список категорий
- `GET /api/public-settings` - Публичные настройки

### Авторизованные
- `POST /api/orders` - Создание заказа
- `GET /api/orders` - Список заказов пользователя
- `POST /api/users/[id]/addresses` - Добавление адреса

### Админские
- `GET /api/admin/products` - Управление товарами
- `GET /api/admin/orders` - Управление заказами
- `GET /api/admin/customers` - Управление клиентами
- `GET /api/admin/analytics` - Аналитика

## Лицензия

Private
