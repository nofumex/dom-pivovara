/**
 * Рекурсивно сериализует объект, конвертируя все Decimal поля в строки
 * и Date в ISO строки
 */
export function serializeObject<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Проверяем, является ли это Decimal (Prisma Decimal имеет метод toString)
  if (obj && typeof obj === 'object' && 'toString' in obj && typeof (obj as any).toString === 'function') {
    // Проверяем, что это Decimal, а не обычный объект
    const decimalLike = obj as any
    if ('toNumber' in decimalLike || 'toFixed' in decimalLike) {
      // Это похоже на Decimal
      try {
        return decimalLike.toString()
      } catch {
        return obj
      }
    }
  }

  // Если это массив, обрабатываем каждый элемент
  if (Array.isArray(obj)) {
    return obj.map(serializeObject)
  }

  // Если это объект, обрабатываем каждое свойство
  if (typeof obj === 'object') {
    const serialized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Проверяем Decimal
      if (value && typeof value === 'object' && 'toString' in value) {
        const decimalLike = value as any
        if ('toNumber' in decimalLike || 'toFixed' in decimalLike) {
          try {
            serialized[key] = decimalLike.toString()
            continue
          } catch {
            // Если не получилось, продолжаем обычную обработку
          }
        }
      }
      
      // Проверяем Date
      if (value instanceof Date) {
        serialized[key] = value.toISOString()
      } else if (value && typeof value === 'object' && value !== null) {
        serialized[key] = serializeObject(value)
      } else {
        serialized[key] = value
      }
    }
    return serialized
  }

  return obj
}
