/**
 * Утилиты для преобразования различных форматов импорта
 * 
 * Поддерживает два формата:
 * 1. export_catalog.json - формат с разделами (sections) и товарами (products),
 *    использующий IBLOCK_ID, IBLOCK_SECTION_ID, PROPS и другие поля
 * 2. standard - стандартный формат системы с полями schemaVersion, products, categories
 * 
 * Формат export_catalog.json:
 * - sections: массив разделов с полями ID, IBLOCK_ID, IBLOCK_SECTION_ID, NAME, CODE, ACTIVE, SORT, DESCRIPTION, PICTURE
 * - products: массив товаров с полями ID, IBLOCK_ID, IBLOCK_SECTION_ID, NAME, CODE, XML_ID, 
 *   PREVIEW_TEXT, DETAIL_TEXT, PREVIEW_PICTURE, DETAIL_PICTURE, PROPS (массив свойств)
 * 
 * PROPS содержит свойства товара:
 * - IBLOCK_PROPERTY_ID: ID свойства (например, 45 - цена, 46 - старая цена)
 * - VALUE: строковое значение
 * - VALUE_ENUM: значение из списка
 * - VALUE_NUM: числовое значение
 */

interface ExportCatalogSection {
  ID: string
  IBLOCK_ID: string
  IBLOCK_SECTION_ID: string | null
  NAME: string
  CODE: string
  ACTIVE: string // 'Y' | 'N'
  GLOBAL_ACTIVE?: string
  LEFT_MARGIN?: number
  RIGHT_MARGIN?: number
  DEPTH_LEVEL?: number
  SORT: string | number
  DESCRIPTION?: string
  PICTURE?: string | null
  IMAGE?: string // Полный URL изображения категории
  DATE_CREATE?: string
  TIMESTAMP_X?: string
  ACTIVE_FROM?: string | null
  ACTIVE_TO?: string | null
  SEARCHABLE_CONTENT?: string
  XML_ID?: string
}

interface ExportCatalogProduct {
  ID: string
  IBLOCK_ID: string
  IBLOCK_SECTION_ID: string
  ACTIVE: string // 'Y' | 'N'
  SORT: string | number
  NAME: string
  CODE: string
  XML_ID: string | null
  PREVIEW_TEXT?: string
  DETAIL_TEXT?: string
  PREVIEW_PICTURE?: string | null
  DETAIL_PICTURE?: string | null
  DATE_CREATE?: string
  TIMESTAMP_X?: string
  ACTIVE_FROM?: string | null
  ACTIVE_TO?: string | null
  PROPS?: Array<{
    IBLOCK_PROPERTY_ID: string
    CODE?: string
    VALUE?: string | number
    VALUE_ENUM?: string
    VALUE_NUM?: number
  }>
  PROPERTIES?: {
    MORE_PHOTO?: {
      VALUE?: string[] // Массив ID изображений
    }
    [key: string]: any
  }
  PICTURE?: string | string[] // URL или массив URL изображений
  IMAGES?: string[] // Массив URL изображений
  PRICES?: Array<{
    PRICE_TYPE?: string
    PRICE?: string | number
    CURRENCY?: string
  }>
}

interface ExportCatalogData {
  iblocks?: number[]
  sections?: ExportCatalogSection[]
  products?: ExportCatalogProduct[]
  elements?: ExportCatalogProduct[] // Альтернативное название для товаров
  images?: Record<string, { ID: string; FULL_PATH: string }> // Маппинг ID изображений на URL
}

interface StandardCategory {
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string
  isActive: boolean
  sortOrder: number
  seoTitle?: string
  seoDesc?: string
}

interface StandardProduct {
  sku: string
  title: string
  slug: string
  description?: string
  content?: string
  price: number
  oldPrice?: number
  stock: number
  minOrder?: number
  weight?: number
  dimensions?: string
  material?: string
  tags?: string[]
  images?: string[]
  isActive: boolean
  isFeatured?: boolean
  isInStock?: boolean
  visibility?: string
  categoryObj?: {
    slug?: string
    name?: string
  }
  seoTitle?: string
  seoDesc?: string
  metaTitle?: string
  metaDesc?: string
  variants?: Array<{
    size?: string
    color?: string
    material?: string
    price: number
    stock: number
    sku: string
    imageUrl?: string
    isActive?: boolean
  }>
}

interface StandardImportData {
  schemaVersion?: string
  products: StandardProduct[]
  categories: StandardCategory[]
  settings?: Record<string, any>
}

/**
 * Маппинг ID свойств на поля товара
 * Можно настроить в зависимости от структуры исходных данных
 */
const PROPERTY_MAPPING: Record<string, keyof StandardProduct> = {
  // Примеры маппинга - нужно настроить под вашу структуру
  '45': 'price', // Цена
  '46': 'oldPrice', // Старая цена
  // Добавьте другие маппинги по необходимости
}

/**
 * Преобразует раздел из формата export_catalog.json в стандартный формат
 */
function transformSection(
  section: ExportCatalogSection, 
  sectionIdMap: Map<string, string>,
  imagesMap?: Map<string, string>
): StandardCategory {
  const slug = section.CODE || `section-${section.ID}`
  // parentId будет slug родительской категории, который потом будет преобразован в ID при импорте
  // Конвертируем IBLOCK_SECTION_ID в строку для поиска в Map
  const parentSectionId = section.IBLOCK_SECTION_ID ? String(section.IBLOCK_SECTION_ID) : null
  const parentSlug = parentSectionId && sectionIdMap.has(parentSectionId)
    ? sectionIdMap.get(parentSectionId)
    : undefined

  // Обработка изображения: приоритет IMAGE (полный URL), затем PICTURE через imagesMap, затем локальный путь
  let imageUrl: string | undefined = undefined
  if (section.IMAGE) {
    imageUrl = section.IMAGE
  } else if (section.PICTURE) {
    const pictureId = String(section.PICTURE)
    // Проверяем imagesMap
    if (imagesMap?.has(pictureId)) {
      imageUrl = imagesMap.get(pictureId)!
    } else {
      // Fallback на локальный путь
      imageUrl = `/uploads/${pictureId}`
    }
  }

  return {
    name: section.NAME,
    slug,
    description: section.DESCRIPTION || undefined,
    image: imageUrl,
    parentId: parentSlug, // Временно храним slug, будет преобразован в ID при импорте
    isActive: section.ACTIVE === 'Y' && (section.GLOBAL_ACTIVE !== 'N'),
    sortOrder: typeof section.SORT === 'string' ? parseInt(section.SORT) || 0 : section.SORT || 0,
    seoTitle: section.NAME,
    seoDesc: section.DESCRIPTION || undefined,
  }
}

/**
 * Преобразует товар из формата export_catalog.json в стандартный формат
 */
function transformProduct(
  product: ExportCatalogProduct,
  sectionIdMap: Map<string, string>,
  imageIdMap?: Map<string, string>
): StandardProduct {
  // Обработка свойств товара
  const props: Record<string, any> = {}
  if (product.PROPS) {
    for (const prop of product.PROPS) {
      const value = prop.VALUE_NUM ?? prop.VALUE_ENUM ?? prop.VALUE
      // Используем CODE если есть, иначе IBLOCK_PROPERTY_ID
      const key = prop.CODE || prop.IBLOCK_PROPERTY_ID
      props[key] = value
      // Также сохраняем по ID для обратной совместимости
      props[prop.IBLOCK_PROPERTY_ID] = value
    }
  }

  // Определение цены из PRICES или свойств
  let price = 0
  let oldPrice: number | undefined = undefined
  
  // Сначала пробуем получить цену из PRICES
  if (product.PRICES && Array.isArray(product.PRICES) && product.PRICES.length > 0) {
    const mainPrice = product.PRICES[0]
    if (mainPrice.PRICE) {
      price = typeof mainPrice.PRICE === 'string' ? parseFloat(mainPrice.PRICE) || 0 : mainPrice.PRICE
    }
  }
  
  // Если не нашли цену в PRICES, ищем в свойствах
  if (price === 0) {
    price = props['MINIMUM_PRICE'] || props['45'] || props['price'] || props['PRICE'] || 0
    oldPrice = props['MAXIMUM_PRICE'] || props['46'] || props['oldPrice'] || props['OLD_PRICE'] || undefined
  }

  // Обработка изображений
  // Приоритет: PICTURE (массив URL), IMAGES, PROPERTIES.MORE_PHOTO, PREVIEW_PICTURE/DETAIL_PICTURE
  const images: string[] = []
  
  // 1. Если есть PICTURE как массив URL
  if (product.PICTURE && Array.isArray(product.PICTURE)) {
    for (const imageUrl of product.PICTURE) {
      if (imageUrl && typeof imageUrl === 'string' && !images.includes(imageUrl)) {
        images.push(imageUrl)
      }
    }
  }
  // 2. Если есть массив IMAGES
  else if (product.IMAGES && Array.isArray(product.IMAGES) && product.IMAGES.length > 0) {
    for (const imageUrl of product.IMAGES) {
      if (imageUrl && typeof imageUrl === 'string' && !images.includes(imageUrl)) {
        images.push(imageUrl)
      }
    }
  }
  // 3. Если есть PROPERTIES.MORE_PHOTO (массив ID изображений)
  else if (product.PROPERTIES?.MORE_PHOTO?.VALUE && Array.isArray(product.PROPERTIES.MORE_PHOTO.VALUE)) {
    for (const imageId of product.PROPERTIES.MORE_PHOTO.VALUE) {
      const imageIdStr = String(imageId)
      const imageUrl = imageIdMap?.get(imageIdStr) || imageIdMap?.get(imageIdStr.replace(/\.[^/.]+$/, ''))
      if (imageUrl && !images.includes(imageUrl)) {
        images.push(imageUrl)
      }
    }
  }
  // 4. Fallback на старый формат с PREVIEW_PICTURE и DETAIL_PICTURE
  else {
    if (product.PREVIEW_PICTURE) {
      const previewImageId = String(product.PREVIEW_PICTURE)
      const previewImage = imageIdMap?.get(previewImageId) || 
                          imageIdMap?.get(previewImageId.replace(/\.[^/.]+$/, '')) ||
                          `/uploads/${previewImageId}`
      if (!images.includes(previewImage)) {
        images.push(previewImage)
      }
    }
    if (product.DETAIL_PICTURE && product.DETAIL_PICTURE !== product.PREVIEW_PICTURE) {
      const detailImageId = String(product.DETAIL_PICTURE)
      const detailImage = imageIdMap?.get(detailImageId) || 
                         imageIdMap?.get(detailImageId.replace(/\.[^/.]+$/, '')) ||
                         `/uploads/${detailImageId}`
      if (!images.includes(detailImage)) {
        images.push(detailImage)
      }
    }
  }

  // Определение категории
  // Конвертируем IBLOCK_SECTION_ID в строку для поиска в Map
  const sectionId = String(product.IBLOCK_SECTION_ID || '')
  const categoryId = sectionId ? sectionIdMap.get(sectionId) : undefined
  const categoryObj = categoryId ? { slug: categoryId } : undefined

  // Генерация slug из CODE или NAME
  const slug = product.CODE || product.ID || product.NAME.toLowerCase().replace(/\s+/g, '-')

  return {
    sku: product.XML_ID || product.ID,
    title: product.NAME,
    slug,
    description: product.PREVIEW_TEXT || undefined,
    content: product.DETAIL_TEXT || undefined,
    price: typeof price === 'string' ? parseFloat(price) || 0 : price,
    oldPrice: oldPrice ? (typeof oldPrice === 'string' ? parseFloat(oldPrice) : oldPrice) : undefined,
    stock: (() => {
      const stockValue = props['IN_STOCK'] || props['stock'] || props['quantity'] || 0
      // Преобразуем в число, если это строка
      if (typeof stockValue === 'string') {
        const parsed = parseInt(stockValue, 10)
        return isNaN(parsed) ? 0 : parsed
      }
      return typeof stockValue === 'number' ? stockValue : 0
    })(),
    minOrder: 1,
    weight: props['weight'] ? (typeof props['weight'] === 'string' ? parseFloat(props['weight']) : props['weight']) : undefined,
    dimensions: props['dimensions'] || undefined,
    material: props['material'] || undefined,
    tags: [],
    images,
    isActive: product.ACTIVE === 'Y',
    isFeatured: false,
    isInStock: (props['stock'] || props['quantity'] || 0) > 0,
    visibility: product.ACTIVE === 'Y' ? 'VISIBLE' : 'HIDDEN',
    categoryObj,
    seoTitle: product.NAME,
    seoDesc: product.PREVIEW_TEXT || undefined,
    metaTitle: product.NAME,
    metaDesc: product.PREVIEW_TEXT || undefined,
  }
}

/**
 * Определяет формат данных импорта
 */
export function detectImportFormat(data: any): 'export_catalog' | 'standard' {
  // Проверяем наличие полей, характерных для export_catalog.json
  if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
    const firstSection = data.sections[0]
    if (firstSection.IBLOCK_ID && firstSection.IBLOCK_SECTION_ID !== undefined) {
      return 'export_catalog'
    }
  }

  // Проверяем наличие полей стандартного формата
  if (data.schemaVersion && data.products && data.categories) {
    return 'standard'
  }

  // Если есть products или elements с полями IBLOCK_SECTION_ID, это export_catalog
  const productsArray = data.products || data.elements
  if (productsArray && Array.isArray(productsArray) && productsArray.length > 0) {
    const firstProduct = productsArray[0]
    if (firstProduct.IBLOCK_SECTION_ID !== undefined) {
      return 'export_catalog'
    }
  }

  return 'standard'
}

/**
 * Преобразует данные из формата export_catalog.json в стандартный формат
 */
export function transformExportCatalogData(
  data: ExportCatalogData,
  imageIdMap?: Map<string, string>
): StandardImportData {
  const categories: StandardCategory[] = []
  const products: StandardProduct[] = []
  const sectionIdMap = new Map<string, string>() // Map<originalId, newSlug>

  // Создаем маппинг изображений из объекта images, если он есть
  const imagesMap = new Map<string, string>()
  if (data.images && typeof data.images === 'object') {
    for (const [imageId, imageData] of Object.entries(data.images)) {
      if (imageData && typeof imageData === 'object' && 'FULL_PATH' in imageData) {
        imagesMap.set(String(imageId), imageData.FULL_PATH)
        // Также добавляем по ID для совместимости
        if ('ID' in imageData) {
          imagesMap.set(String(imageData.ID), imageData.FULL_PATH)
        }
      }
    }
  }
  // Если был передан imageIdMap, объединяем его с imagesMap
  if (imageIdMap) {
    imageIdMap.forEach((value, key) => {
      imagesMap.set(key, value)
    })
  }

  // Сначала обрабатываем разделы, создавая маппинг ID -> slug
  if (data.sections && Array.isArray(data.sections)) {
    // Сортируем разделы по DEPTH_LEVEL для правильной обработки иерархии
    const sortedSections = [...data.sections].sort((a, b) => {
      const depthA = a.DEPTH_LEVEL || 0
      const depthB = b.DEPTH_LEVEL || 0
      return depthA - depthB
    })

    for (const section of sortedSections) {
      const transformed = transformSection(section, sectionIdMap, imagesMap)
      // Убеждаемся, что ключ всегда строка
      sectionIdMap.set(String(section.ID), transformed.slug)
      categories.push(transformed)
    }
  }

  // Затем обрабатываем товары (используем elements или products)
  const productsArray = data.elements || data.products || []
  if (Array.isArray(productsArray) && productsArray.length > 0) {
    let productsWithoutCategory = 0
    for (const product of productsArray) {
      try {
        const transformed = transformProduct(product, sectionIdMap, imagesMap)
        if (!transformed.categoryObj) {
          productsWithoutCategory++
          if (productsWithoutCategory <= 5) {
            console.warn(`[TRANSFORM] Товар ${product.ID} (${product.NAME}) не нашел категорию. IBLOCK_SECTION_ID=${product.IBLOCK_SECTION_ID}`)
          }
        }
        products.push(transformed)
      } catch (error) {
        console.error(`Ошибка при преобразовании товара ${product.ID}:`, error)
      }
    }
    if (productsWithoutCategory > 0) {
      console.warn(`[TRANSFORM] Всего ${productsWithoutCategory} товаров не нашли категорию из ${productsArray.length}`)
    }
  }

  return {
    schemaVersion: '1.0',
    products,
    categories,
  }
}

/**
 * Нормализует данные импорта независимо от формата
 */
export function normalizeImportData(data: any, imageIdMap?: Map<string, string>): StandardImportData {
  const format = detectImportFormat(data)

  if (format === 'export_catalog') {
    return transformExportCatalogData(data, imageIdMap)
  }

  // Стандартный формат уже в нужном виде
  return {
    schemaVersion: data.schemaVersion || '1.0',
    products: data.products || [],
    categories: data.categories || [],
    settings: data.settings,
  }
}

