# Техническая спецификация интернет-магазина

## Содержание
1. [Общая архитектура](#общая-архитектура)
2. [Технологический стек](#технологический-стек)
3. [База данных](#база-данных)
4. [Система аутентификации](#система-аутентификации)
5. [API Endpoints](#api-endpoints)
6. [Админ-панель](#админ-панель)
7. [Функционал магазина](#функционал-магазина)
8. [Система импорта/экспорта](#система-импортаэкспорта)
9. [Email система](#email-система)
10. [Файловая система](#файловая-система)
11. [Развертывание](#развертывание)

---

## Общая архитектура

### Тип приложения
- **Full-stack Next.js приложение** (App Router)
- **Монолитная архитектура** с разделением на клиентскую и серверную части
- **RESTful API** для всех операций с данными
- **Server-Side Rendering (SSR)** и **Static Site Generation (SSG)**

### Структура проекта
```
/
├── src/
│   ├── app/              # Next.js App Router страницы и API routes
│   │   ├── api/          # API endpoints
│   │   ├── admin/        # Админ-панель (страницы)
│   │   └── [pages]/      # Публичные страницы
│   ├── components/       # React компоненты
│   ├── lib/              # Утилиты и сервисы
│   ├── store/            # Zustand stores (состояние)
│   └── types/            # TypeScript типы
├── prisma/               # Prisma ORM схема и миграции
├── public/               # Статические файлы
└── tests/                # Тесты (Jest + Playwright)
```

---

## Технологический стек

### Backend
- **Next.js 14** (App Router)
- **TypeScript 5.3**
- **Prisma ORM 5.7** (PostgreSQL)
- **Node.js 18+**

### Frontend
- **React 18.2**
- **Tailwind CSS 3.3**
- **Zustand 4.4** (state management)
- **React Hook Form 7.48** (формы)
- **Zod 3.22** (валидация)
- **Framer Motion 10.16** (анимации)

### База данных
- **PostgreSQL 15**
- **Prisma Client** для запросов

### Аутентификация
- **JWT (jsonwebtoken)** - access tokens (15 минут)
- **JWT Refresh Tokens** - refresh tokens (7 дней)
- **bcryptjs** - хеширование паролей
- **Sessions** - хранение refresh tokens в БД

### Дополнительные библиотеки
- **nodemailer** - отправка email
- **sharp** - обработка изображений
- **papaparse** - парсинг CSV
- **xlsx** - работа с Excel
- **jszip** - работа с ZIP архивами
- **axios** - HTTP клиент
- **react-query** - кеширование данных

---

## База данных

### Схема базы данных (Prisma)

#### Модель User (Пользователь)
```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String
  firstName String
  lastName  String
  phone     String?
  company   String?
  role      UserRole  @default(CUSTOMER)
  isBlocked Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  addresses Address[]
  orders    Order[]
  reviews   Review[]
  sessions  Session[]
}
```

**Роли пользователей:**
- `CUSTOMER` - обычный клиент
- `ADMIN` - администратор (полный доступ)
- `MANAGER` - менеджер (управление заказами и товарами)
- `VIEWER` - просмотрщик (только чтение)

#### Модель Session (Сессии)
```prisma
model Session {
  id           String   @id @default(cuid())
  userId       String
  refreshToken String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### Модель Address (Адреса)
```prisma
model Address {
  id      String  @id @default(cuid())
  userId  String
  name    String
  street  String
  city    String
  region  String
  zipCode String
  phone   String?
  isMain  Boolean @default(false)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders  Order[]
}
```

#### Модель Category (Категории)
```prisma
model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  image       String?
  parentId    String?
  isActive    Boolean    @default(true)
  sortOrder   Int        @default(0)
  seoTitle    String?
  seoDesc     String?
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
}
```

**Особенности:**
- Иерархическая структура (родитель-потомок)
- SEO поля (seoTitle, seoDesc)
- Сортировка через sortOrder

#### Модель Product (Товары)
```prisma
model Product {
  id          String            @id @default(cuid())
  sku         String            @unique
  title       String
  slug        String            @unique
  description String?
  content     String?
  price       Decimal           @db.Decimal(10, 2)
  oldPrice    Decimal?          @db.Decimal(10, 2)
  currency    String            @default("RUB")
  stock       Int               @default(0)
  minOrder    Int               @default(1)
  weight      Decimal?          @db.Decimal(8, 3)
  dimensions  String?
  material    String?
  category    ProductCategory   @default(ECONOMY)
  tags        String[]
  images      String[]
  isActive    Boolean           @default(true)
  isFeatured  Boolean           @default(false)
  isInStock   Boolean           @default(true)
  visibility  ProductVisibility @default(VISIBLE)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  seoTitle    String?
  seoDesc     String?
  metaTitle   String?
  metaDesc    String?
  categoryId  String
  orderItems  OrderItem[]
  variants    ProductVariant[]
  categoryObj Category          @relation(fields: [categoryId], references: [id])
  reviews     Review[]
}
```

**Enum ProductCategory:**
- `ECONOMY` - эконом класс
- `MIDDLE` - средний класс
- `LUXURY` - премиум класс

**Enum ProductVisibility:**
- `VISIBLE` - видимый
- `HIDDEN` - скрытый
- `DRAFT` - черновик

#### Модель ProductVariant (Варианты товаров)
```prisma
model ProductVariant {
  id        String      @id @default(cuid())
  productId String
  size      String?
  color     String?
  material  String?
  price     Decimal     @db.Decimal(10, 2)
  stock     Int         @default(0)
  sku       String      @unique
  imageUrl  String?
  isActive  Boolean     @default(true)
  product   Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderItems OrderItem[]
}
```

**Особенности:**
- Каждый вариант имеет свой SKU, цену, остаток
- Может иметь отдельное изображение (imageUrl)
- Связан с основным товаром через productId

#### Модель Order (Заказы)
```prisma
model Order {
  id           String       @id @default(cuid())
  orderNumber  String       @unique
  userId       String
  status       OrderStatus  @default(NEW)
  total        Decimal      @db.Decimal(10, 2)
  subtotal     Decimal      @db.Decimal(10, 2)
  delivery     Decimal      @default(0) @db.Decimal(8, 2)
  discount     Decimal      @default(0) @db.Decimal(8, 2)
  firstName    String
  lastName     String
  company      String?
  phone        String
  email        String
  notes        String?
  deliveryType DeliveryType @default(PICKUP)
  addressId    String?
  trackNumber  String?
  promoCode    String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  items        OrderItem[]
  logs         OrderLog[]
  address      Address?     @relation(fields: [addressId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
}
```

**Enum OrderStatus:**
- `NEW` - новый заказ
- `PROCESSING` - в обработке
- `SHIPPED` - отгружен
- `DELIVERED` - доставлен
- `CANCELLED` - отменён

**Enum DeliveryType:**
- `PICKUP` - самовывоз
- `COURIER` - курьер
- `TRANSPORT` - транспортная компания

#### Модель OrderItem (Элементы заказа)
```prisma
model OrderItem {
  id         String          @id @default(cuid())
  orderId    String
  productId  String
  variantId  String?
  quantity   Int
  price      Decimal         @db.Decimal(10, 2)
  total      Decimal         @db.Decimal(10, 2)
  selectedColor String?
  selectedSize  String?
  order      Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product    Product         @relation(fields: [productId], references: [id])
  variant    ProductVariant? @relation(fields: [variantId], references: [id])
}
```

#### Модель OrderLog (Логи заказов)
```prisma
model OrderLog {
  id        String      @id @default(cuid())
  orderId   String
  status    OrderStatus
  comment   String?
  createdAt DateTime    @default(now())
  createdBy String?
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
}
```

#### Модель Review (Отзывы)
```prisma
model Review {
  id        String   @id @default(cuid())
  productId String
  userId    String
  rating    Int      @db.SmallInt
  title     String?
  content   String
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([productId, userId])
}
```

**Особенности:**
- Один пользователь может оставить только один отзыв на товар
- Отзывы требуют модерации (isActive = false по умолчанию)

#### Модель Lead (Заявки/Лиды)
```prisma
model Lead {
  id        String     @id @default(cuid())
  name      String
  phone     String?
  email     String?
  company   String?
  message   String?
  source    String?
  status    LeadStatus @default(NEW)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}
```

**Enum LeadStatus:**
- `NEW` - новая заявка
- `CONTACTED` - связались
- `QUALIFIED` - квалифицирована
- `CONVERTED` - конвертирована
- `LOST` - потеряна

#### Модель Setting (Настройки)
```prisma
model Setting {
  id    String      @id @default(cuid())
  key   String      @unique
  value String
  type  SettingType @default(STRING)
}
```

**Enum SettingType:**
- `STRING` - строка
- `NUMBER` - число
- `BOOLEAN` - булево
- `JSON` - JSON объект

**Основные настройки:**
- `contactEmail` - email для связи
- `contactPhone` - телефон
- `address` - адрес
- `minOrderTotal` - минимальная сумма заказа
- `socialLinks` - социальные сети (JSON)
- `extraContacts` - дополнительные контакты (JSON)
- `emailSettings` - настройки SMTP (JSON)
- `popupEnabled` - включен ли popup
- `popupTemplate` - шаблон popup
- `popupTitle`, `popupText`, `popupImageUrl` - контент popup
- `popupButtonLabel`, `popupButtonUrl` - кнопка popup
- `popupDelaySeconds` - задержка показа popup

#### Модель HeroImage (Главные изображения)
```prisma
model HeroImage {
  id        String   @id @default(cuid())
  url       String
  alt       String?
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Модель Page (Страницы)
```prisma
model Page {
  id        String   @id @default(cuid())
  title     String
  slug      String   @unique
  content   String
  seoTitle  String?
  seoDesc   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Модель AuditLog (Логи аудита)
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String
  resource   String
  resourceId String?
  oldData    Json?
  newData    Json?
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())
}
```

---

## Система аутентификации

### Механизм работы

1. **Регистрация/Вход:**
   - Пользователь отправляет email и password
   - Пароль хешируется через bcryptjs (12 rounds)
   - Создается JWT access token (15 минут) и refresh token (7 дней)
   - Refresh token сохраняется в таблице Session

2. **Access Token:**
   - Содержит: `userId`, `email`, `role`
   - Время жизни: 15 минут
   - Хранится в cookies или Authorization header

3. **Refresh Token:**
   - Содержит: `userId`
   - Время жизни: 7 дней
   - Хранится в cookies и БД (таблица Session)

4. **Обновление токена:**
   - При истечении access token, клиент отправляет refresh token
   - Сервер проверяет refresh token в БД
   - Выдает новую пару токенов

5. **Выход:**
   - Удаляется refresh token из БД
   - Очищаются cookies

### API Endpoints аутентификации

#### POST `/api/auth/register`
Регистрация нового пользователя

**Request:**
```json
{
  "firstName": "Иван",
  "lastName": "Иванов",
  "email": "ivan@example.com",
  "password": "password123",
  "phone": "+7 999 123-45-67",
  "company": "ООО Компания"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "ivan@example.com",
      "firstName": "Иван",
      "lastName": "Иванов",
      "role": "CUSTOMER"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### POST `/api/auth/login`
Вход в систему

**Request:**
```json
{
  "email": "ivan@example.com",
  "password": "password123"
}
```

**Response:** (аналогично register)

#### POST `/api/auth/refresh`
Обновление access token

**Request:**
```json
{
  "refreshToken": "..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### POST `/api/auth/logout`
Выход из системы

**Request:**
```json
{
  "refreshToken": "..."
}
```

#### GET `/api/auth/me`
Получение текущего пользователя

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "ivan@example.com",
    "firstName": "Иван",
    "lastName": "Иванов",
    "role": "CUSTOMER"
  }
}
```

### Middleware проверки прав

**Функция `verifyAuth(request)`** - проверяет наличие валидного access token
**Функция `verifyRole(request, ['ADMIN', 'MANAGER'])`** - проверяет роль пользователя

---

## API Endpoints

### Публичные API (без аутентификации)

#### GET `/api/products`
Получение списка товаров с фильтрацией

**Query параметры:**
- `page` - номер страницы (default: 1)
- `limit` - количество на странице (default: 20)
- `category` - slug категории
- `priceMin` - минимальная цена
- `priceMax` - максимальная цена
- `inStock` - только в наличии (true/false)
- `productCategory` - ECONOMY/MIDDLE/LUXURY
- `material` - фильтр по материалу
- `search` - поиск по названию/описанию
- `sortBy` - price/name/createdAt/rating
- `sortOrder` - asc/desc
- `id[]` - массив ID товаров (для избранного)

**Response:**
```json
{
  "success": true,
  "data": [...products],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### GET `/api/products/[slug]`
Получение товара по slug

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "...",
    "price": 1000,
    "variants": [...],
    "categoryObj": {...},
    "reviews": [...]
  }
}
```

#### GET `/api/products/[slug]/variants`
Получение вариантов товара

#### GET `/api/categories`
Получение категорий

**Query параметры:**
- `includeProducts` - включить товары (true/false)
- `parentId` - фильтр по родительской категории

#### GET `/api/public-settings`
Получение публичных настроек сайта

#### GET `/api/hero-images`
Получение главных изображений для слайдера

### API для авторизованных пользователей

#### POST `/api/orders`
Создание заказа

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "items": [
    {
      "productId": "...",
      "variantId": "...",
      "quantity": 2,
      "selectedColor": "Красный",
      "selectedSize": "L"
    }
  ],
  "firstName": "Иван",
  "lastName": "Иванов",
  "phone": "+7 999 123-45-67",
  "email": "ivan@example.com",
  "deliveryType": "COURIER",
  "addressId": "...",
  "notes": "Комментарий"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {...},
    "orderNumber": "TK-123456-ABC"
  }
}
```

#### GET `/api/orders`
Получение списка заказов пользователя

**Query параметры:**
- `page`, `limit` - пагинация
- `status` - фильтр по статусу
- `dateFrom`, `dateTo` - фильтр по дате
- `search` - поиск

#### GET `/api/orders/[id]`
Получение заказа по ID

#### GET `/api/users/[id]`
Получение профиля пользователя

#### GET `/api/users/[id]/addresses`
Получение адресов пользователя

#### POST `/api/users/[id]/addresses`
Создание адреса

#### PUT `/api/users/[id]/addresses/[addressId]`
Обновление адреса

#### DELETE `/api/users/[id]/addresses/[addressId]`
Удаление адреса

#### POST `/api/leads`
Создание заявки (лида)

**Request:**
```json
{
  "name": "Иван",
  "phone": "+7 999 123-45-67",
  "email": "ivan@example.com",
  "company": "ООО Компания",
  "message": "Текст сообщения",
  "source": "contact-form"
}
```

#### POST `/api/upload`
Загрузка файла (изображения)

**Request:** FormData
- `file` - файл изображения

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/filename.jpg",
    "filename": "filename.jpg"
  }
}
```

### Админ API (требует роль ADMIN/MANAGER)

#### GET `/api/admin/products`
Получение списка товаров (с расширенными фильтрами)

**Query параметры:**
- Все параметры из публичного API
- `visibility` - VISIBLE/HIDDEN/DRAFT
- `isActive` - true/false

#### POST `/api/admin/products`
Создание товара

**Request:**
```json
{
  "sku": "PROD001",
  "title": "Название товара",
  "slug": "nazvanie-tovara",
  "description": "Описание",
  "price": 1000,
  "oldPrice": 1200,
  "stock": 10,
  "minOrder": 1,
  "categoryId": "...",
  "category": "ECONOMY",
  "images": ["/uploads/image1.jpg"],
  "isActive": true,
  "isFeatured": false,
  "visibility": "VISIBLE",
  "variants": [
    {
      "sku": "VAR001",
      "color": "Красный",
      "size": "L",
      "price": 1000,
      "stock": 5,
      "imageUrl": "/uploads/variant1.jpg"
    }
  ]
}
```

#### PUT `/api/admin/products/[slug]`
Обновление товара

#### DELETE `/api/admin/products/[slug]`
Удаление товара

#### GET `/api/admin/products/[slug]/variants`
Получение вариантов товара

#### POST `/api/admin/products/[slug]/variants`
Создание варианта товара

#### PUT `/api/admin/products/[slug]/variants/[variantId]`
Обновление варианта

#### DELETE `/api/admin/products/[slug]/variants/[variantId]`
Удаление варианта

#### GET `/api/admin/orders`
Получение всех заказов (с фильтрами)

#### GET `/api/admin/orders/[id]`
Получение заказа

#### PUT `/api/admin/orders/[id]`
Обновление заказа (статус, трек-номер)

**Request:**
```json
{
  "status": "PROCESSING",
  "trackNumber": "TRACK123",
  "notes": "Комментарий"
}
```

#### GET `/api/admin/customers` (или `/api/users`)
Получение списка пользователей

**Query параметры:**
- `page`, `limit`
- `search` - поиск по имени/email/компании
- `role` - фильтр по роли
- `isBlocked` - true/false

#### GET `/api/admin/customers/[id]`
Получение пользователя

#### PUT `/api/admin/customers/[id]`
Обновление пользователя (роль, блокировка)

#### GET `/api/admin/categories`
Получение категорий

#### POST `/api/admin/categories`
Создание категории

#### PUT `/api/admin/categories/[id]`
Обновление категории

#### DELETE `/api/admin/categories/[id]`
Удаление категории

#### GET `/api/admin/leads`
Получение заявок

**Query параметры:**
- `page`, `limit`
- `status` - фильтр по статусу
- `search` - поиск

#### PUT `/api/admin/leads/[id]`
Обновление заявки (статус)

#### GET `/api/admin/analytics`
Получение аналитики

**Query параметры:**
- `period` - 7d/30d/90d/1y
- `startDate`, `endDate` - кастомный период

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "totalOrders": 50,
    "totalRevenue": 500000,
    "totalProducts": 200,
    "newUsers": 10,
    "newOrders": 5,
    "recentOrders": [...],
    "topProducts": [...],
    "orderStats": {
      "byStatus": {...},
      "byDate": [...]
    },
    "userStats": {
      "byDate": [...]
    },
    "revenueStats": {
      "byDate": [...]
    }
  }
}
```

#### GET `/api/admin/settings`
Получение всех настроек

#### PUT `/api/admin/settings`
Обновление настроек

**Request:**
```json
{
  "contactEmail": "info@example.com",
  "contactPhone": "+7 999 123-45-67",
  "address": "Адрес",
  "minOrderTotal": 1000,
  "socialLinks": [
    {"label": "VK", "url": "https://vk.com/..."}
  ],
  "extraContacts": [
    {
      "title": "Отдел продаж",
      "values": ["+7 999 111-11-11"]
    }
  ],
  "emailSettings": {
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpUser": "user@gmail.com",
    "smtpPassword": "password",
    "fromEmail": "noreply@example.com",
    "companyEmail": "info@example.com"
  },
  "popupEnabled": true,
  "popupTemplate": "center",
  "popupTitle": "Заголовок",
  "popupText": "Текст",
  "popupImageUrl": "/uploads/popup.jpg",
  "popupButtonLabel": "Кнопка",
  "popupButtonUrl": "/catalog",
  "popupDelaySeconds": 3
}
```

#### GET `/api/admin/settings/[key]`
Получение конкретной настройки

#### PUT `/api/admin/settings/[key]`
Обновление конкретной настройки

#### GET `/api/admin/hero-images`
Получение главных изображений

#### POST `/api/admin/hero-images`
Создание главного изображения

**Request:**
```json
{
  "url": "/uploads/hero1.jpg",
  "alt": "Описание",
  "order": 0,
  "isActive": true
}
```

#### PUT `/api/admin/hero-images/[id]`
Обновление главного изображения

#### DELETE `/api/admin/hero-images/[id]`
Удаление главного изображения

#### GET `/api/admin/export`
Экспорт данных

**Query параметры:**
- `format` - zip/json/xlsx (default: zip)

**Response:** файл для скачивания

#### POST `/api/admin/import`
Импорт данных

**Request:** FormData
- `file` - ZIP архив с данными
- `options` - JSON с опциями:
  ```json
  {
    "skipExisting": false,
    "updateExisting": true,
    "importMedia": true
  }
  ```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": {
      "products": 100,
      "categories": 10,
      "media": 50
    },
    "errors": [],
    "warnings": [],
    "skipped": {
      "products": [],
      "categories": [],
      "media": []
    }
  }
}
```

#### POST `/api/admin/validate-file`
Валидация файла перед импортом

#### POST `/api/admin/import/wordpress-variants`
Импорт вариантов из WordPress

#### POST `/api/admin/test-email`
Тестирование email конфигурации

**Request:**
```json
{
  "to": "test@example.com"
}
```

---

## Админ-панель

### Структура админ-панели

Все страницы админ-панели находятся в `/admin/*` и защищены проверкой роли.

### Страницы админ-панели

#### `/admin` (Dashboard)
Главная страница с аналитикой:
- Общая статистика (пользователи, заказы, товары, выручка)
- Графики по периодам
- Последние заказы
- Топ товары

#### `/admin/products`
Управление товарами:
- Список товаров с фильтрами и поиском
- Создание/редактирование товара
- Управление вариантами товаров
- Массовые операции

**Функционал:**
- Фильтрация по категории, видимости, активности
- Поиск по названию, описанию, SKU
- Сортировка по цене, названию, дате создания, остатку
- Пагинация

#### `/admin/products/create`
Создание нового товара:
- Основная информация (название, описание, цена, остаток)
- Категория
- Изображения (множественная загрузка)
- SEO настройки
- Варианты товара (цвет, размер, материал)

#### `/admin/products/[slug]/edit`
Редактирование товара (аналогично созданию)

#### `/admin/orders`
Управление заказами:
- Список заказов с фильтрами
- Детали заказа
- Изменение статуса
- Добавление трек-номера
- История изменений

**Фильтры:**
- По статусу
- По дате
- По пользователю
- Поиск по номеру заказа, имени, email

#### `/admin/orders/[id]`
Детальная страница заказа:
- Информация о клиенте
- Состав заказа
- Адрес доставки
- История изменений статуса
- Возможность изменить статус и добавить трек-номер

#### `/admin/customers`
Управление клиентами:
- Список пользователей
- Фильтры по роли, блокировке
- Поиск по имени, email, компании
- Просмотр профиля клиента
- Изменение роли и блокировка

#### `/admin/customers/[id]`
Профиль клиента:
- Личная информация
- История заказов
- Адреса доставки

#### `/admin/categories`
Управление категориями:
- Древовидная структура категорий
- Создание/редактирование/удаление
- Настройка порядка сортировки
- SEO настройки

#### `/admin/leads`
Управление заявками:
- Список заявок
- Фильтры по статусу
- Изменение статуса заявки
- Просмотр деталей

#### `/admin/analytics`
Аналитика:
- Графики по выручке, заказам, пользователям
- Выбор периода (7 дней, 30 дней, 90 дней, год, кастомный)
- Топ товары
- Статистика по статусам заказов

#### `/admin/import-export`
Импорт/экспорт данных:
- Экспорт в ZIP/JSON/XLSX
- Импорт из ZIP архива
- Валидация файлов перед импортом
- Настройки импорта (пропускать существующие, обновлять, импортировать медиа)

#### `/admin/settings`
Настройки сайта:
- Контактная информация
- Социальные сети
- Дополнительные контакты
- Настройки email (SMTP)
- Настройки popup
- Минимальная сумма заказа

### Компоненты админ-панели

#### `AdminLayout`
Основной layout с:
- Боковым меню (sidebar)
- Верхней панелью с информацией о пользователе
- Навигацией между разделами
- Выходом из системы

#### `ProductVariantsManager`
Компонент для управления вариантами товара:
- Добавление/удаление вариантов
- Настройка цвета, размера, материала
- Установка цены и остатка для варианта
- Загрузка изображения для варианта

---

## Функционал магазина

### Корзина (Cart)

**Хранение:** Zustand store с persist (localStorage)

**Структура CartItem:**
```typescript
{
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  product: Product;
  selectedColor?: string;
  selectedSize?: string;
}
```

**Методы:**
- `addItem(product, quantity)` - добавление товара
- `removeItem(itemId)` - удаление товара
- `updateQuantity(itemId, quantity)` - изменение количества
- `clearCart()` - очистка корзины
- `getTotalPrice()` - общая стоимость
- `getTotalItems()` - общее количество товаров

**Особенности:**
- Товары с разными вариантами считаются разными позициями
- Сохранение в localStorage для восстановления после перезагрузки

### Избранное (Favorites)

**Хранение:** Zustand store с persist (localStorage)

**Методы:**
- `add(productId)` - добавить в избранное
- `remove(productId)` - удалить из избранного
- `toggle(productId)` - переключить
- `has(productId)` - проверить наличие
- `getAll()` - получить все ID

### Профиль пользователя

**Страницы:**
- `/profile` - основной профиль
- `/profile/orders` - история заказов
- `/profile/addresses` - адресная книга
- `/profile/settings` - настройки аккаунта

**Функционал:**
- Просмотр и редактирование личной информации
- Управление адресами доставки
- История заказов с деталями
- Смена пароля

### Каталог товаров

**Страница:** `/catalog`

**Функционал:**
- Фильтрация по категориям
- Фильтрация по цене
- Фильтрация по наличию
- Фильтрация по категории товара (ECONOMY/MIDDLE/LUXURY)
- Поиск по названию/описанию
- Сортировка (цена, название, дата, рейтинг)
- Пагинация

### Страница товара

**Страница:** `/products/[slug]`

**Функционал:**
- Детальная информация о товаре
- Галерея изображений
- Выбор вариантов (цвет, размер, материал)
- Добавление в корзину
- Добавление в избранное
- Отзывы и рейтинг
- Похожие товары

### Оформление заказа

**Страница:** `/checkout`

**Шаги:**
1. Проверка корзины
2. Ввод данных доставки
3. Выбор способа доставки
4. Выбор адреса (или ввод нового)
5. Комментарий к заказу
6. Подтверждение и создание заказа

**После создания заказа:**
- Отправка email клиенту
- Отправка email администратору
- Очистка корзины
- Редирект на страницу заказа

### Публичные страницы

- `/` - главная страница
- `/about` - о компании
- `/contacts` - контакты
- `/delivery` - доставка
- `/return` - возврат
- `/privacy` - политика конфиденциальности
- `/faq` - часто задаваемые вопросы
- `/reviews` - отзывы
- `/services/custom` - индивидуальный пошив
- `/services/samples` - образцы
- `/services/wholesale` - опт

---

## Система импорта/экспорта

### Экспорт данных

**Формат:** ZIP архив, содержащий:
- `data.json` - все данные в JSON формате
- `media/` - папка с изображениями
- `README.md` - описание архива

**Структура data.json:**
```json
{
  "schemaVersion": "1.0",
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "products": [...],
  "categories": [...],
  "mediaIndex": [...],
  "settings": {...}
}
```

**Форматы экспорта:**
- ZIP (по умолчанию) - полный экспорт с медиа
- JSON - только данные без медиа
- XLSX - Excel файл с листами (Товары, Категории, Настройки)

### Импорт данных

**Поддерживаемые форматы:**
- ZIP архив (с data.json и media/)
- JSON файл

**Процесс импорта:**
1. Валидация файла
2. Распаковка архива (если ZIP)
3. Парсинг data.json
4. Импорт категорий
5. Импорт товаров
6. Импорт вариантов товаров
7. Импорт медиафайлов (если включено)

**Опции импорта:**
- `skipExisting` - пропускать существующие записи
- `updateExisting` - обновлять существующие записи
- `importMedia` - импортировать изображения

**Результат импорта:**
```json
{
  "success": true,
  "processed": {
    "products": 100,
    "categories": 10,
    "media": 50
  },
  "errors": [],
  "warnings": [],
  "skipped": {
    "products": [],
    "categories": [],
    "media": []
  }
}
```

### Импорт из WordPress

**Endpoint:** `/api/admin/import/wordpress-variants`

Специальный импорт вариантов товаров из WordPress WooCommerce.

---

## Email система

### Конфигурация SMTP

Настройки хранятся в таблице Settings с ключом `emailSettings` (тип JSON):

```json
{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpUser": "user@gmail.com",
  "smtpPassword": "app-password",
  "fromEmail": "noreply@example.com",
  "companyEmail": "info@example.com"
}
```

### Отправка email

**Библиотека:** nodemailer

**Поддержка:**
- Gmail SMTP
- Yandex SMTP
- Mail.ru SMTP
- Outlook SMTP
- Кастомные SMTP серверы

**Fallback механизм:**
При ошибке подключения к основному SMTP, система пробует альтернативные конфигурации.

### Типы email

#### Email клиенту при создании заказа
- Тема: "Ваш заказ № [номер]"
- Содержит: состав заказа, общая сумма

#### Email администратору при новом заказе
- Тема: "Новый заказ № [номер]"
- Содержит: данные клиента, адрес доставки, состав заказа

### Тестирование email

**Endpoint:** `/api/admin/test-email`

Отправляет тестовое письмо для проверки конфигурации SMTP.

---

## Файловая система

### Загрузка файлов

**Endpoint:** `/api/upload`

**Ограничения:**
- Максимальный размер: 5MB (настраивается через MAX_FILE_SIZE)
- Разрешенные типы: image/jpeg, image/png, image/webp
- Сохранение в: `public/uploads/`

**Процесс:**
1. Валидация файла (размер, тип)
2. Генерация уникального имени файла
3. Сохранение в `public/uploads/`
4. Возврат URL файла

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/1234567890_filename.jpg",
    "filename": "1234567890_filename.jpg"
  }
}
```

### Обработка изображений

**Библиотека:** sharp

Возможности:
- Ресайз изображений
- Оптимизация качества
- Конвертация форматов

---

## Развертывание

### Переменные окружения

**Файл:** `.env`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
DIRECT_URL="postgresql://user:password@localhost:5432/dbname"

# JWT
JWT_SECRET="your-jwt-secret-min-32-characters"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-min-32-characters"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
FROM_EMAIL="noreply@example.com"

# File Upload
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=5242880

# Site
SITE_URL="http://localhost:3000"
SITE_NAME="Название магазина"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

### Docker

**Файлы:**
- `Dockerfile` - образ приложения
- `docker-compose.yml` - оркестрация сервисов

**Сервисы:**
- `app` - Next.js приложение
- `db` - PostgreSQL база данных
- `nginx` - reverse proxy (опционально)

### Миграции базы данных

```bash
# Создание миграции
npm run db:migrate

# Применение миграций
npx prisma migrate deploy

# Генерация Prisma Client
npm run db:generate
```

### Сборка и запуск

```bash
# Установка зависимостей
npm install

# Генерация Prisma Client
npm run db:generate

# Применение миграций
npm run db:migrate

# Заполнение начальными данными (опционально)
npm run db:seed

# Разработка
npm run dev

# Сборка
npm run build

# Продакшн
npm start
```

### PM2 (для продакшна)

**Файл:** `ecosystem.config.js`

```bash
# Запуск
pm2 start ecosystem.config.js

# Остановка
pm2 stop ecosystem.config.js

# Перезапуск
pm2 restart ecosystem.config.js
```

---

## Дополнительные функции

### SEO

- Meta теги для каждой страницы
- Structured Data (JSON-LD)
- Sitemap.xml (автоматическая генерация)
- Robots.txt

### Аналитика

- Google Analytics (настраивается через переменные окружения)
- Facebook Pixel (настраивается через переменные окружения)
- События конверсий (покупка, добавление в корзину)

### Безопасность

- Хеширование паролей (bcrypt, 12 rounds)
- JWT токены с коротким временем жизни
- Refresh tokens в БД
- Валидация всех входных данных (Zod)
- Защита от SQL инъекций (Prisma)
- CORS настройки
- Rate limiting (через nodemailer для email)

### Производительность

- Server-Side Rendering (SSR)
- Static Site Generation (SSG) где возможно
- Кеширование через React Query
- Оптимизация изображений (sharp)
- Lazy loading компонентов

---

## Важные замечания для реализации

1. **Все API endpoints должны возвращать единый формат ответа:**
   ```json
   {
     "success": boolean,
     "data": any,
     "error": string (optional),
     "message": string (optional)
   }
   ```

2. **Пагинация всегда должна быть в формате:**
   ```json
   {
     "pagination": {
       "page": number,
       "limit": number,
       "total": number,
       "pages": number
     }
   }
   ```

3. **Все входные данные должны валидироваться через Zod схемы**

4. **Все защищенные endpoints должны проверять роль через `verifyRole()`**

5. **Пароли всегда хешируются через bcryptjs с 12 rounds**

6. **Все даты хранятся в UTC и отображаются в локальном времени**

7. **Изображения сохраняются в `public/uploads/` с уникальными именами**

8. **Email настройки хранятся в таблице Settings, а не в .env (для возможности изменения через админку)**

9. **Refresh tokens автоматически очищаются при истечении**

10. **Все операции с БД должны использовать Prisma Client, не сырые SQL запросы**

---

## Заключение

Данная спецификация описывает полную техническую реализацию интернет-магазина. Все описанные функции должны быть реализованы точно так же, как указано в документе. Дизайн и фронтенд могут отличаться, но вся бизнес-логика, API, база данных и админ-панель должны быть идентичными.

