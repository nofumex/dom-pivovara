/**
 * Утилиты для преобразования различных форматов импорта
 * 
 * Поддерживает форматы:
 * 1. export_catalog.json (Битрикс формат) - формат с разделами (sections) и товарами (products/elements),
 *    использующий IBLOCK_ID, IBLOCK_SECTION_ID, PROPS и другие поля
 * 2. standard - стандартный формат системы с полями schemaVersion, products, categories
 * 
 * Формат export_catalog.json / Битрикс:
 * - iblocks: массив ID инфоблоков (опционально)
 * - sections: массив разделов с полями ID, IBLOCK_ID, IBLOCK_SECTION_ID, NAME, CODE, ACTIVE, SORT, 
 *   DESCRIPTION, DESCRIPTION_TYPE ('text' | 'html'), PICTURE (ID), IMAGE (полный URL), DEPTH_LEVEL
 * - products или elements: массив товаров с полями ID, IBLOCK_ID, IBLOCK_SECTION_ID, NAME, CODE, XML_ID, 
 *   PREVIEW_TEXT, DETAIL_TEXT, PROPERTIES (объект с MORE_PHOTO, CML2_ARTICLE и др.), PICTURE (массив объектов)
 * - images: массив картинок с полями ID, FULL_PATH, SUBDIR, FILE_NAME, ORIGINAL_NAME
 * 
 * PROPERTIES содержит свойства товара:
 * - MORE_PHOTO: { VALUE: string[] } - массив ID изображений
 * - CML2_ARTICLE: { VALUE: string } - артикул товара
 * - CML2_MANUFACTURER: { VALUE: string | null } - производитель
 * 
 * PICTURE в elements - массив объектов с полями:
 * - ID: string
 * - FULL_PATH: string (полный URL)
 * - SUBDIR: string
 * - FILE_NAME: string
 * - ORIGINAL_NAME: string
 * 
 * Маппинг картинок:
 * - Картинки из массива images маппятся по ID на FULL_PATH
 * - Если FULL_PATH отсутствует, путь собирается из SUBDIR и FILE_NAME
 * - Картинки категорий ищутся по IMAGE (полный URL) или PICTURE (ID) через маппинг images
 * - Картинки товаров ищутся через PROPERTIES.MORE_PHOTO.VALUE (массив ID) или массив PICTURE
 */

import { slugify } from './utils'

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
  DESCRIPTION_TYPE?: 'text' | 'html'
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
  CODE?: string
  XML_ID?: string | null
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
    // Новый формат: плоский объект, где ключ - название свойства, значение - значение свойства
    CML2_ARTICLE?: string
    MANUFACTURER?: string
    WEIGHT?: string
    MORE_PHOTO?: string[] // Массив ID изображений (не объект с VALUE)
    [key: string]: string | string[] | number | null | undefined
  }
  PICTURE?: string[] // Массив URL строк (новый формат)
  PRICES?: Array<{
    PRICE_TYPE: string
    PRICE: number
    CURRENCY: string
  }>
  IMAGES?: string[] // Массив URL изображений (для обратной совместимости)
}

interface ExportCatalogData {
  iblocks?: number[] | string[]
  sections?: ExportCatalogSection[]
  products?: ExportCatalogProduct[]
  elements?: ExportCatalogProduct[] // Альтернативное название для products
  pictures?: Array<{
    ID: string
    SUBDIR?: string
    FILE_NAME?: string
    ORIGINAL_NAME?: string
    FULL_PATH?: string
  }>
  images?: {
    // Новый формат: объект, где ключ - ID изображения, значение - объект с данными
    [imageId: string]: {
      ID: string
      FULL_PATH?: string
      SUBDIR?: string
      FILE_NAME?: string
      ORIGINAL_NAME?: string
    }
  }
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
  imageIdMap?: Map<string, string>
): StandardCategory {
  // Используем CODE как slug для категорий
  const slug = section.CODE || `section-${section.ID}`
  // parentId будет slug родительской категории, который потом будет преобразован в ID при импорте
  // Конвертируем IBLOCK_SECTION_ID в строку для поиска в Map
  const parentSectionId = section.IBLOCK_SECTION_ID ? String(section.IBLOCK_SECTION_ID) : null
  const parentSlug = parentSectionId && sectionIdMap.has(parentSectionId)
    ? sectionIdMap.get(parentSectionId)
    : undefined

  // Обработка изображения категории
  // Приоритет: IMAGE (полный URL) > PICTURE через маппинг > undefined
  let sectionImage: string | undefined = undefined
  if (section.IMAGE) {
    sectionImage = section.IMAGE
  } else if (section.PICTURE && imageIdMap) {
    const pictureId = String(section.PICTURE)
    sectionImage = imageIdMap.get(pictureId)
  }

  return {
    name: section.NAME,
    slug,
    description: section.DESCRIPTION || undefined, // Сохраняем как есть, без удаления отступов
    image: sectionImage,
    parentId: parentSlug, // Временно храним slug, будет преобразован в ID при импорте
    isActive: section.ACTIVE === 'Y' && (section.GLOBAL_ACTIVE === undefined || section.GLOBAL_ACTIVE !== 'N'),
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
  // Обработка свойств товара (старый формат PROPS)
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

  // Обработка нового формата PROPERTIES (плоский объект)
  if (product.PROPERTIES) {
    // Копируем все свойства напрямую (новый формат - плоский объект)
    for (const [key, value] of Object.entries(product.PROPERTIES)) {
      if (value !== undefined && value !== null) {
        props[key] = value
      }
    }
  }

  // Определение цены из PRICES или свойств
  let price = 0
  let oldPrice: number | undefined = undefined
  
  // Приоритет 1: PRICES (новый формат)
  if (product.PRICES && Array.isArray(product.PRICES) && product.PRICES.length > 0) {
    // Берем первую цену с PRICE_TYPE "1" или первую доступную
    const mainPrice = product.PRICES.find((p: any) => p.PRICE_TYPE === '1') || product.PRICES[0]
    if (mainPrice && typeof mainPrice.PRICE === 'number') {
      price = mainPrice.PRICE
    }
  }
  
  // Приоритет 2: Из свойств (старый формат)
  if (price === 0) {
    price = props['MINIMUM_PRICE'] || props['45'] || props['price'] || props['PRICE'] || 0
    oldPrice = props['MAXIMUM_PRICE'] || props['46'] || props['oldPrice'] || props['OLD_PRICE'] || undefined
  }

  // Обработка изображений
  const images: string[] = []
  
  // Приоритет 1: Массив PICTURE со строками (URL) - новый формат
  if (product.PICTURE && Array.isArray(product.PICTURE) && product.PICTURE.length > 0) {
    for (const pic of product.PICTURE) {
      // Проверяем, это строка (URL) или объект (старый формат)
      if (typeof pic === 'string') {
        // Новый формат: массив строк с URL
        if (!images.includes(pic)) {
          images.push(pic)
        }
      } else if (typeof pic === 'object' && pic !== null) {
        // Старый формат: массив объектов
        if ((pic as any).FULL_PATH) {
          if (!images.includes((pic as any).FULL_PATH)) {
            images.push((pic as any).FULL_PATH)
          }
        } else if ((pic as any).ID && imageIdMap) {
          const imagePath = imageIdMap.get(String((pic as any).ID))
          if (imagePath && !images.includes(imagePath)) {
            images.push(imagePath)
          }
        }
      }
    }
  }
  
  // Приоритет 2: PROPERTIES.MORE_PHOTO (массив ID изображений) - новый формат
  if (product.PROPERTIES?.MORE_PHOTO && Array.isArray(product.PROPERTIES.MORE_PHOTO) && imageIdMap) {
    for (const imageId of product.PROPERTIES.MORE_PHOTO) {
      const imageIdStr = String(imageId)
      const imagePath = imageIdMap.get(imageIdStr)
      if (imagePath && !images.includes(imagePath)) {
        images.push(imagePath)
      }
    }
  }
  
  // Приоритет 3: Массив IMAGES (для обратной совместимости)
  if (images.length === 0 && product.IMAGES && Array.isArray(product.IMAGES) && product.IMAGES.length > 0) {
    for (const imageUrl of product.IMAGES) {
      if (imageUrl && typeof imageUrl === 'string' && !images.includes(imageUrl)) {
        images.push(imageUrl)
      }
    }
  }
  
  // Приоритет 4: Fallback на формат с PREVIEW_PICTURE и DETAIL_PICTURE
  if (images.length === 0) {
    if (product.PREVIEW_PICTURE && imageIdMap) {
      const previewImageId = String(product.PREVIEW_PICTURE)
      const previewImage = imageIdMap.get(previewImageId) || 
                          imageIdMap.get(previewImageId.replace(/\.[^/.]+$/, ''))
      if (previewImage && !images.includes(previewImage)) {
        images.push(previewImage)
      }
    }
    if (product.DETAIL_PICTURE && product.DETAIL_PICTURE !== product.PREVIEW_PICTURE && imageIdMap) {
      const detailImageId = String(product.DETAIL_PICTURE)
      const detailImage = imageIdMap.get(detailImageId) || 
                         imageIdMap.get(detailImageId.replace(/\.[^/.]+$/, ''))
      if (detailImage && !images.includes(detailImage)) {
        images.push(detailImage)
      }
    }
  }

  // Определение категории
  // Конвертируем IBLOCK_SECTION_ID в строку для поиска в Map
  // Обрабатываем null, undefined, пустую строку, число и строку
  let sectionId: string | null = null
  if (product.IBLOCK_SECTION_ID !== null && product.IBLOCK_SECTION_ID !== undefined && product.IBLOCK_SECTION_ID !== '') {
    sectionId = String(product.IBLOCK_SECTION_ID).trim()
  }
  
  const categoryId = sectionId ? sectionIdMap.get(sectionId) : undefined
  const categoryObj = categoryId ? { slug: categoryId } : undefined
  
  // Логирование для отладки (только первые несколько случаев)
  if (!categoryObj && sectionId) {
    // Проверяем, есть ли секция в мапе
    if (!sectionIdMap.has(sectionId)) {
      // Логируем только первые 5 случаев, чтобы не засорять логи
      const logKey = `missing_section_${sectionId}`
      if (!(globalThis as any)[logKey]) {
        (globalThis as any)[logKey] = true
        console.warn(`[TRANSFORM] Секция с ID "${sectionId}" не найдена в sectionIdMap для товара ${product.ID} (${product.NAME})`)
        console.warn(`[TRANSFORM] Доступные ID в sectionIdMap: ${Array.from(sectionIdMap.keys()).slice(0, 10).join(', ')}...`)
      }
    }
  }

  // Генерация slug из NAME (как указал пользователь)
  const slug = slugify(product.NAME) || product.ID || `product-${product.ID}`

  return {
    sku: props['CML2_ARTICLE'] || product.XML_ID || product.ID,
    title: product.NAME,
    slug,
    description: product.PREVIEW_TEXT || undefined, // Сохраняем как есть, без удаления отступов
    content: product.DETAIL_TEXT || undefined, // Сохраняем как есть, без удаления отступов
    price: typeof price === 'string' ? parseFloat(price) || 0 : (typeof price === 'number' ? price : 0),
    oldPrice: oldPrice ? (typeof oldPrice === 'string' ? parseFloat(oldPrice) : (typeof oldPrice === 'number' ? oldPrice : undefined)) : undefined,
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
  // Проверяем наличие полей, характерных для export_catalog.json (Битрикс формат)
  if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
    const firstSection = data.sections[0]
    if (firstSection.IBLOCK_ID && firstSection.IBLOCK_SECTION_ID !== undefined) {
      return 'export_catalog'
    }
  }

  // Проверяем формат с elements (альтернативное название для products в Битрикс)
  if (data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
    const firstElement = data.elements[0]
    if (firstElement.IBLOCK_SECTION_ID !== undefined || firstElement.IBLOCK_ID) {
      return 'export_catalog'
    }
  }

  // Проверяем наличие полей стандартного формата
  if (data.schemaVersion && data.products && data.categories) {
    return 'standard'
  }

  // Если есть только products с полями IBLOCK_SECTION_ID, это export_catalog
  if (data.products && Array.isArray(data.products) && data.products.length > 0) {
    const firstProduct = data.products[0]
    if (firstProduct.IBLOCK_SECTION_ID !== undefined) {
      return 'export_catalog'
    }
  }

  return 'standard'
}

/**
 * Создает маппинг картинок из массива pictures или объекта images
 */
function buildPictureMap(
  pictures?: Array<{
    ID: string
    SUBDIR?: string
    FILE_NAME?: string
    ORIGINAL_NAME?: string
    FULL_PATH?: string
  }>,
  images?: {
    [imageId: string]: {
      ID: string
      FULL_PATH?: string
      SUBDIR?: string
      FILE_NAME?: string
      ORIGINAL_NAME?: string
    }
  }
): Map<string, string> {
  const pictureMap = new Map<string, string>()
  
  // Обрабатываем новый формат images (объект)
  if (images && typeof images === 'object' && !Array.isArray(images)) {
    for (const [imageId, imageData] of Object.entries(images)) {
      const id = String(imageId)
      let path = imageData.FULL_PATH
      
      if (!path && imageData.SUBDIR && imageData.FILE_NAME) {
        const subdir = imageData.SUBDIR.startsWith('/') ? imageData.SUBDIR.slice(1) : imageData.SUBDIR
        path = `/${subdir}/${imageData.FILE_NAME}`
      } else if (!path && imageData.FILE_NAME) {
        path = `/upload/${imageData.FILE_NAME}`
      }
      
      if (path) {
        if (!path.startsWith('http') && !path.startsWith('/upload') && !path.startsWith('/')) {
          path = `/upload/${path}`
        } else if (!path.startsWith('http') && !path.startsWith('/')) {
          path = `/${path}`
        }
        pictureMap.set(id, path)
        // Также добавляем по ID из объекта для совместимости
        if (imageData.ID && imageData.ID !== id) {
          pictureMap.set(String(imageData.ID), path)
        }
      }
    }
  }
  
  // Обрабатываем старый формат pictures (массив) для обратной совместимости
  if (pictures && Array.isArray(pictures)) {
    for (const picture of pictures) {
      const id = String(picture.ID)
      // Используем FULL_PATH если есть, иначе собираем путь из SUBDIR и FILE_NAME
      let path = picture.FULL_PATH
      
      if (!path && picture.SUBDIR && picture.FILE_NAME) {
        // Убираем ведущий слэш из SUBDIR если есть
        const subdir = picture.SUBDIR.startsWith('/') ? picture.SUBDIR.slice(1) : picture.SUBDIR
        path = `/${subdir}/${picture.FILE_NAME}`
      } else if (!path && picture.FILE_NAME) {
        path = `/upload/${picture.FILE_NAME}`
      }
      
      if (path) {
        // Если FULL_PATH уже содержит полный URL (начинается с http), оставляем как есть
        // Иначе нормализуем путь
        if (!path.startsWith('http') && !path.startsWith('/upload') && !path.startsWith('/')) {
          path = `/upload/${path}`
        } else if (!path.startsWith('http') && !path.startsWith('/')) {
          path = `/${path}`
        }
        pictureMap.set(id, path)
        // Также добавляем без расширения для совместимости
        const idWithoutExt = id.replace(/\.[^/.]+$/, '')
        if (idWithoutExt !== id) {
          pictureMap.set(idWithoutExt, path)
        }
      }
    }
  }
  
  return pictureMap
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

  // Создаем маппинг картинок из объекта images или массива pictures
  // Приоритет: images (объект) > pictures (массив) - новый формат использует images как объект
  const picturesMap = buildPictureMap(
    Array.isArray(data.pictures) ? data.pictures : undefined,
    data.images && typeof data.images === 'object' && !Array.isArray(data.images) ? data.images : undefined
  )
  // Объединяем с переданным imageIdMap
  const finalImageIdMap = new Map<string, string>(imageIdMap)
  for (const [key, value] of picturesMap.entries()) {
    finalImageIdMap.set(key, value)
  }

  if (picturesMap.size > 0) {
    console.log(`[TRANSFORM] Создан маппинг из ${picturesMap.size} картинок`)
  }

  // Сначала обрабатываем разделы, создавая маппинг ID -> slug
  if (data.sections && Array.isArray(data.sections)) {
    console.log(`[TRANSFORM] Найдено ${data.sections.length} секций для обработки`)
    
    // Сортируем разделы по DEPTH_LEVEL для правильной обработки иерархии
    const sortedSections = [...data.sections].sort((a, b) => {
      const depthA = a.DEPTH_LEVEL || 0
      const depthB = b.DEPTH_LEVEL || 0
      return depthA - depthB
    })

    for (const section of sortedSections) {
      const transformed = transformSection(section, sectionIdMap, finalImageIdMap)
      
      // Убеждаемся, что ключ всегда строка
      const sectionIdKey = String(section.ID)
      sectionIdMap.set(sectionIdKey, transformed.slug)
      categories.push(transformed)
    }
    
    console.log(`[TRANSFORM] Обработано ${categories.length} категорий, создано ${sectionIdMap.size} записей в маппинге`)
    console.log(`[TRANSFORM] Примеры ID в маппинге: ${Array.from(sectionIdMap.keys()).slice(0, 10).join(', ')}`)
  } else {
    console.warn(`[TRANSFORM] Секции не найдены или не являются массивом`)
  }

  // Обрабатываем товары (products или elements)
  const productsToProcess = data.products || data.elements || []
  if (Array.isArray(productsToProcess) && productsToProcess.length > 0) {
    console.log(`[TRANSFORM] Найдено ${productsToProcess.length} товаров для обработки`)
    
    let productsWithoutCategory = 0
    let productsWithCategory = 0
    const missingSectionIds = new Set<string>()
    
    for (const product of productsToProcess) {
      try {
        const transformed = transformProduct(product, sectionIdMap, finalImageIdMap)
        if (!transformed.categoryObj) {
          productsWithoutCategory++
          const sectionId = product.IBLOCK_SECTION_ID ? String(product.IBLOCK_SECTION_ID) : 'null/empty'
          missingSectionIds.add(sectionId)
          
          if (productsWithoutCategory <= 10) {
            console.warn(`[TRANSFORM] Товар ${product.ID} (${product.NAME}) не нашел категорию. IBLOCK_SECTION_ID=${sectionId}`)
          }
        } else {
          productsWithCategory++
        }
        products.push(transformed)
      } catch (error) {
        console.error(`Ошибка при преобразовании товара ${product.ID}:`, error)
      }
    }
    
    console.log(`[TRANSFORM] Обработано товаров: ${products.length}, с категорией: ${productsWithCategory}, без категории: ${productsWithoutCategory}`)
    if (missingSectionIds.size > 0) {
      console.warn(`[TRANSFORM] Уникальных отсутствующих IBLOCK_SECTION_ID: ${Array.from(missingSectionIds).slice(0, 20).join(', ')}`)
    }
  } else {
    console.warn(`[TRANSFORM] Товары не найдены или не являются массивом`)
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

