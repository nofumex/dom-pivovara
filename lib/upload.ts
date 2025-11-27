import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'
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
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Недопустимый тип файла. Разрешены: JPEG, PNG, WebP')
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // Create upload directory if it doesn't exist
  const uploadPath = subfolder ? join(UPLOAD_DIR, subfolder) : UPLOAD_DIR
  if (!existsSync(uploadPath)) {
    await mkdir(uploadPath, { recursive: true })
  }

  // Generate unique filename
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  const extension = file.name.split('.').pop() || 'jpg'
  const filename = `${timestamp}-${random}.${extension}`
  const filepath = join(uploadPath, filename)

  // Convert File to Buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Optimize image with sharp
  const optimizedBuffer = await sharp(buffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()

  // Save file
  await writeFile(filepath, optimizedBuffer)

  // Return URL
  const url = subfolder ? `/uploads/${subfolder}/${filename}` : `/uploads/${filename}`

  return {
    url,
    filename,
  }
}


