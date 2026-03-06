import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { Readable } from 'stream'
import crypto from 'crypto'
import path from 'path'

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'iziresto'
const R2_ENDPOINT = process.env.R2_ENDPOINT || ''
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export type StorageFolder = 
  | 'avatars'
  | 'logos'
  | 'restaurants'
  | 'restaurant-logos'
  | 'products'
  | 'categories'
  | 'covers'
  | 'branding'
  | 'documents'
  | 'invoices'

interface UploadOptions {
  folder: StorageFolder
  fileName?: string
  contentType?: string
  metadata?: Record<string, string>
}

interface UploadResult {
  success: boolean
  key?: string
  url?: string
  error?: string
}

function generateUniqueFileName(originalName: string): string {
  const ext = path.extname(originalName)
  const hash = crypto.randomBytes(16).toString('hex')
  const timestamp = Date.now()
  return `${timestamp}-${hash}${ext}`
}

function getPublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`
  }
  return `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`
}

export function isStorageConfigured(): boolean {
  return !!(R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ENDPOINT && R2_BUCKET_NAME)
}

export async function uploadFile(
  file: Buffer | Readable,
  originalName: string,
  options: UploadOptions
): Promise<UploadResult> {
  if (!isStorageConfigured()) {
    console.warn('[Storage] R2 not configured, skipping upload')
    return { success: false, error: 'Storage not configured' }
  }

  try {
    const fileName = options.fileName || generateUniqueFileName(originalName)
    const key = `${options.folder}/${fileName}`

    const contentType = options.contentType || getMimeType(originalName)

    if (file instanceof Buffer) {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: options.metadata,
      })

      await s3Client.send(command)
    } else {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: file,
          ContentType: contentType,
          Metadata: options.metadata,
        },
      })

      await upload.done()
    }

    const url = getPublicUrl(key)
    console.log(`[Storage] Uploaded: ${key}`)

    return { success: true, key, url }
  } catch (error) {
    console.error('[Storage] Upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

export async function deleteFile(key: string): Promise<boolean> {
  if (!isStorageConfigured()) {
    console.warn('[Storage] R2 not configured, skipping delete')
    return false
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
    console.log(`[Storage] Deleted: ${key}`)
    return true
  } catch (error) {
    console.error('[Storage] Delete error:', error)
    return false
  }
}

export async function fileExists(key: string): Promise<boolean> {
  if (!isStorageConfigured()) {
    return false
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
    return true
  } catch {
    return false
  }
}

export async function getFile(key: string): Promise<Buffer | null> {
  if (!isStorageConfigured()) {
    return null
  }

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })

    const response = await s3Client.send(command)
    
    if (response.Body) {
      const chunks: Uint8Array[] = []
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk)
      }
      return Buffer.concat(chunks)
    }

    return null
  } catch (error) {
    console.error('[Storage] Get file error:', error)
    return null
  }
}

export function extractKeyFromUrl(url: string): string | null {
  if (!url) return null

  if (R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL)) {
    return url.replace(`${R2_PUBLIC_URL}/`, '')
  }

  const bucketPattern = new RegExp(`/${R2_BUCKET_NAME}/(.+)$`)
  const match = url.match(bucketPattern)
  if (match) {
    return match[1]
  }

  const folders: StorageFolder[] = ['avatars', 'logos', 'restaurants', 'products', 'categories', 'documents', 'invoices']
  for (const folder of folders) {
    if (url.includes(`/${folder}/`)) {
      const idx = url.indexOf(`/${folder}/`)
      return url.substring(idx + 1)
    }
  }

  return null
}

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024

export function validateImageFile(
  mimeType: string,
  size: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return { 
      valid: false, 
      error: 'Type de fichier non autorise. Formats acceptes: JPG, PNG, GIF, WebP, SVG' 
    }
  }

  if (size > MAX_IMAGE_SIZE) {
    return { 
      valid: false, 
      error: `Fichier trop volumineux. Taille max: ${MAX_IMAGE_SIZE / 1024 / 1024}MB` 
    }
  }

  return { valid: true }
}

export function validateDocumentFile(
  mimeType: string,
  size: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
    return { 
      valid: false, 
      error: 'Type de fichier non autorise. Formats acceptes: PDF, DOC, DOCX' 
    }
  }

  if (size > MAX_DOCUMENT_SIZE) {
    return { 
      valid: false, 
      error: `Fichier trop volumineux. Taille max: ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB` 
    }
  }

  return { valid: true }
}

export const storage = {
  upload: uploadFile,
  delete: deleteFile,
  exists: fileExists,
  get: getFile,
  extractKey: extractKeyFromUrl,
  isConfigured: isStorageConfigured,
  validateImage: validateImageFile,
  validateDocument: validateDocumentFile,
  getPublicUrl,
}
