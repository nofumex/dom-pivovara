import { z } from 'zod'

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  phone: z.string().optional(),
  company: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
})

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU обязателен'),
  title: z.string().min(1, 'Название обязательно'),
  slug: z.string().min(1, 'Slug обязателен'),
  description: z.string().optional(),
  content: z.string().optional(),
  price: z.number().positive('Цена должна быть положительной'),
  oldPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  stockStatus: z.enum(['MANY', 'ENOUGH', 'FEW', 'NONE']),
  minOrder: z.number().int().min(1).default(1),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  category: z.enum(['ECONOMY', 'MIDDLE', 'LUXURY']).default('ECONOMY'),
  tags: z.array(z.string()).default([]),
  badges: z.array(z.enum(['HIT', 'NEW', 'SALE'])).default([]),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isInStock: z.boolean().default(true),
  visibility: z.enum(['VISIBLE', 'HIDDEN', 'DRAFT']).default('VISIBLE'),
  categoryId: z.string().min(1, 'Категория обязательна'),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  slug: z.string().min(1, 'Slug обязателен'),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
})

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().int().min(1),
      selectedColor: z.string().optional(),
      selectedSize: z.string().optional(),
    })
  ).min(1, 'Корзина пуста'),
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
  phone: z.string().min(1, 'Телефон обязателен'),
  email: z.string().email('Некорректный email'),
  company: z.string().optional(),
  deliveryType: z.enum(['PICKUP', 'COURIER', 'TRANSPORT']).default('PICKUP'),
  addressId: z.string().optional(),
  notes: z.string().optional(),
  promoCode: z.string().optional(),
})

export const createAddressSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  street: z.string().min(1, 'Улица обязательна'),
  city: z.string().min(1, 'Город обязателен'),
  region: z.string().min(1, 'Регион обязателен'),
  zipCode: z.string().min(1, 'Индекс обязателен'),
  phone: z.string().optional(),
  isMain: z.boolean().default(false),
})

export const createReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  content: z.string().min(10, 'Отзыв должен содержать минимум 10 символов'),
})

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Имя обязательно'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
})


