# Skill: Storage (Cloudflare R2)

## Quand utiliser ce skill
- Upload d'images (produits, logos, avatars)
- Génération de PDFs (factures)
- Gestion des fichiers médias

---

## Configuration

### Variables d'environnement
```bash
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=iziresto
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://cdn.iziresto.com
```

---

## Service Storage

```typescript
// src/services/storage.service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuid } from 'uuid'
import path from 'path'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

export const storageService = {
  async upload(file: Buffer, options: {
    filename: string
    mimeType: string
    folder?: string
  }): Promise<{ url: string; key: string }> {
    const ext = path.extname(options.filename)
    const key = options.folder 
      ? `${options.folder}/${uuid()}${ext}`
      : `${uuid()}${ext}`

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: options.mimeType,
    }))

    return {
      url: `${PUBLIC_URL}/${key}`,
      key,
    }
  },

  async delete(key: string): Promise<void> {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }))
  },

  async getSignedUploadUrl(options: {
    filename: string
    mimeType: string
    folder?: string
    expiresIn?: number
  }): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const ext = path.extname(options.filename)
    const key = options.folder 
      ? `${options.folder}/${uuid()}${ext}`
      : `${uuid()}${ext}`

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: options.mimeType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: options.expiresIn || 3600,
    })

    return {
      uploadUrl,
      key,
      publicUrl: `${PUBLIC_URL}/${key}`,
    }
  },

  getPublicUrl(key: string): string {
    return `${PUBLIC_URL}/${key}`
  },
}
```

---

## Upload avec Multer

### Configuration Multer
```typescript
// src/middlewares/upload.middleware.ts
import multer from 'multer'
import { AppError } from '@/utils/errors'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      cb(new AppError('Type de fichier non autorisé', 400, 'INVALID_FILE_TYPE'))
      return
    }
    cb(null, true)
  },
})
```

### Route Upload
```typescript
// src/routes/upload.routes.ts
import { Router } from 'express'
import { auth } from '@/middlewares/auth.middleware'
import { upload } from '@/middlewares/upload.middleware'
import { uploadController } from '@/controllers/upload.controller'

const router = Router()

router.post(
  '/image',
  auth,
  upload.single('file'),
  uploadController.uploadImage
)

router.post(
  '/images',
  auth,
  upload.array('files', 10),
  uploadController.uploadImages
)

export { router as uploadRoutes }
```

### Controller Upload
```typescript
// src/controllers/upload.controller.ts
import { Request, Response, NextFunction } from 'express'
import { storageService } from '@/services/storage.service'
import { success } from '@/utils/response'
import { AppError } from '@/utils/errors'

export const uploadController = {
  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('Fichier requis', 400, 'FILE_REQUIRED')
      }

      const folder = req.body.folder || 'uploads'
      
      const result = await storageService.upload(req.file.buffer, {
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        folder,
      })

      return success(res, result)
    } catch (error) {
      next(error)
    }
  },

  async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[]
      
      if (!files || files.length === 0) {
        throw new AppError('Fichiers requis', 400, 'FILES_REQUIRED')
      }

      const folder = req.body.folder || 'uploads'
      
      const results = await Promise.all(
        files.map((file) =>
          storageService.upload(file.buffer, {
            filename: file.originalname,
            mimeType: file.mimetype,
            folder,
          })
        )
      )

      return success(res, results)
    } catch (error) {
      next(error)
    }
  },

  async getUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename, mimeType, folder } = req.body

      const result = await storageService.getSignedUploadUrl({
        filename,
        mimeType,
        folder,
      })

      return success(res, result)
    } catch (error) {
      next(error)
    }
  },
}
```

---

## Frontend Upload

### Hook useUpload
```typescript
// hooks/useUpload.ts
import { useState } from 'react'
import { api } from '@/lib/api-client'

interface UploadResult {
  url: string
  key: string
}

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = async (file: File, folder?: string): Promise<UploadResult> => {
    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (folder) formData.append('folder', folder)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { data } = await response.json()
      return data
    } finally {
      setUploading(false)
      setProgress(100)
    }
  }

  return { upload, uploading, progress }
}
```

### Composant ImageUpload
```tsx
// components/shared/ImageUpload.tsx
'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUpload } from '@/hooks/useUpload'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (url: string | null) => void
  folder?: string
  className?: string
}

export function ImageUpload({ value, onChange, folder, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading } = useUpload()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await upload(file, folder)
      onChange(result.url)
    } catch (error) {
      console.error('Upload error:', error)
    }
  }

  const handleRemove = () => {
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
          <Image
            src={value}
            alt="Uploaded"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square w-full flex-col items-center justify-center rounded-lg border-2 border-dashed hover:border-primary"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="mt-2 text-sm text-muted-foreground">
                Cliquer pour uploader
              </span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
```

---

## Dossiers par type

| Dossier | Usage |
|---------|-------|
| `products/` | Images produits |
| `restaurants/` | Logos et covers restaurants |
| `avatars/` | Avatars utilisateurs |
| `invoices/` | PDFs factures |
| `media/` | Médiathèque restaurant |

---

## Optimisation Images

### Avec next/image
```tsx
<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={400}
  className="object-cover"
  placeholder="blur"
  blurDataURL="/placeholder.png"
/>
```

### Redimensionnement côté serveur (optionnel)
```typescript
import sharp from 'sharp'

async function resizeImage(buffer: Buffer, width: number, height: number) {
  return sharp(buffer)
    .resize(width, height, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer()
}
```
