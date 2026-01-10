import { StockStatus } from '@prisma/client'

/**
 * Вычисляет статус наличия товара на основе количества на складе
 * Градация:
 * - 0: NONE (Нет в наличии)
 * - 1-2: FEW (Мало)
 * - 3-10: ENOUGH (Достаточно)
 * - >10: MANY (Много)
 */
export function calculateStockStatus(stock: number): StockStatus {
  if (stock === 0) {
    return 'NONE'
  }
  if (stock >= 1 && stock <= 2) {
    return 'FEW'
  }
  if (stock >= 3 && stock <= 10) {
    return 'ENOUGH'
  }
  // stock > 10
  return 'MANY'
}

/**
 * Вычисляет статус наличия товара на основе количества и isInStock
 * Если isInStock = false, возвращает NONE независимо от количества
 */
export function calculateStockStatusWithAvailability(
  stock: number,
  isInStock?: boolean
): StockStatus {
  if (isInStock === false) {
    return 'NONE'
  }
  return calculateStockStatus(stock)
}

/**
 * Получает stockStatus для продукта, рассчитывая его если не указан
 * Для клиентской стороны - возвращает строку в верхнем регистре
 */
export function getStockStatus(
  stockStatus?: string | StockStatus | null,
  stock?: number,
  isInStock?: boolean
): string {
  // Если stockStatus уже указан, используем его
  if (stockStatus) {
    return stockStatus.toUpperCase()
  }
  
  // Иначе рассчитываем из stock и isInStock
  const calculatedStock = stock ?? 0
  const status = calculateStockStatusWithAvailability(calculatedStock, isInStock)
  return status
}

