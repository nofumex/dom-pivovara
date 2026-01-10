import { writeFile, mkdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

// Используем абсолютный путь через process.cwd()
// Если UPLOAD_DIR абсолютный (начинается с /), используем его
// Если относительный, делаем абсолютным относительно process.cwd()
const getUploadDir = () => {
  if (process.env.UPLOAD_DIR) {
    if (process.env.UPLOAD_DIR.startsWith('/')) {
      return process.env.UPLOAD_DIR
    }
    return join(process.cwd(), process.env.UPLOAD_DIR)
  }
  return join(process.cwd(), 'public', 'uploads')
}

const UPLOAD_DIR = getUploadDir()
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) // 5MB default

export interface UploadResult {
  url: string
  filename: string
}

export async function saveUploadedFile(
  file: File,
  subfolder: string = ''
): Promise<UploadResult> {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF')
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // Create upload directory if it doesn't exist
  const uploadPath = subfolder ? join(UPLOAD_DIR, subfolder) : UPLOAD_DIR
  
  console.log(`📁 Upload directory: ${uploadPath}`)
  
  if (!existsSync(uploadPath)) {
    try {
      await mkdir(uploadPath, { recursive: true, mode: 0o755 })
      console.log(`✅ Created directory: ${uploadPath}`)
    } catch (error: any) {
      console.error(`❌ Failed to create directory ${uploadPath}:`, error)
      throw new Error(`Не удалось создать директорию: ${error.message}`)
    }
  }

  // Generate unique filename
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${timestamp}-${random}.${extension}`
  const filepath = join(uploadPath, filename)

  console.log(`📤 Saving file: ${filepath}`)

  // Convert File to Buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Optimize image with sharp
  let optimizedBuffer: Buffer
  try {
    optimizedBuffer = await sharp(buffer)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()
  } catch (error: any) {
    console.warn('⚠️ Sharp optimization failed, using original:', error.message)
    // Если sharp не работает, используем оригинальный buffer
    optimizedBuffer = buffer
  }

  // Save file
  try {
    await writeFile(filepath, optimizedBuffer)
    console.log(`✅ File saved: ${filepath}`)
    
    // Проверяем, что файл действительно создан и доступен
    const stats = await stat(filepath)
    if (stats.size === 0) {
      throw new Error('Файл создан, но пустой')
    }
    console.log(`✅ File verified: ${filepath} (${stats.size} bytes)`)
  } catch (error: any) {
    console.error(`❌ Failed to save file ${filepath}:`, error)
    throw new Error(`Не удалось сохранить файл: ${error.message}`)
  }

  // Return URL
  const url = subfolder ? `/uploads/${subfolder}/${filename}` : `/uploads/${filename}`

  return {
    url,
    filename,
  }
}

/**
 * Загружает изображение по URL и сохраняет локально
 */
export async function downloadImageFromUrl(
  imageUrl: string,
  subfolder: string = ''
): Promise<UploadResult> {
  try {
    // Загружаем изображение
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Не удалось загрузить изображение: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      throw new Error('URL не указывает на изображение')
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    // Проверка размера
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`Изображение слишком большое. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Create upload directory if it doesn't exist
    const uploadPath = subfolder ? join(UPLOAD_DIR, subfolder) : UPLOAD_DIR
    
    if (!existsSync(uploadPath)) {
      try {
        await mkdir(uploadPath, { recursive: true, mode: 0o755 })
        console.log(`✅ Created directory: ${uploadPath}`)
      } catch (error: any) {
        console.error(`❌ Failed to create directory ${uploadPath}:`, error)
        throw new Error(`Не удалось создать директорию: ${error.message}`)
      }
    }

    // Определяем расширение из URL или content-type
    const urlExtension = imageUrl.split('.').pop()?.toLowerCase() || 'jpg'
    const extension = ['jpg', 'jpeg', 'png', 'webp'].includes(urlExtension) 
      ? urlExtension 
      : contentType.includes('png') ? 'png' 
      : contentType.includes('webp') ? 'webp'
      : 'jpg'

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const filename = `${timestamp}-${random}.${extension}`
    const filepath = join(uploadPath, filename)

    // Optimize image with sharp
    let optimizedBuffer: Buffer
    try {
      optimizedBuffer = await sharp(buffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()
    } catch (error: any) {
      console.warn('⚠️ Sharp optimization failed, using original:', error.message)
      optimizedBuffer = buffer
    }

    // Save file
    try {
      await writeFile(filepath, optimizedBuffer)
      console.log(`✅ File saved: ${filepath}`)
      
      // Проверяем, что файл действительно создан
      const stats = await stat(filepath)
      if (stats.size === 0) {
        throw new Error('Файл создан, но пустой')
      }
      console.log(`✅ File verified: ${filepath} (${stats.size} bytes)`)
    } catch (error: any) {
      console.error(`❌ Failed to save file ${filepath}:`, error)
      throw new Error(`Не удалось сохранить файл: ${error.message}`)
    }

    // Return URL
    const url = subfolder ? `/uploads/${subfolder}/${filename}` : `/uploads/${filename}`

    return {
      url,
      filename,
    }
  } catch (error: any) {
    throw new Error(`Ошибка при загрузке изображения ${imageUrl}: ${error.message}`)
  }
}


























