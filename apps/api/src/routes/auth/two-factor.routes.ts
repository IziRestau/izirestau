import { Router } from 'express'
import { generateSecret, verifySync } from 'otplib'
import QRCode from 'qrcode'
import { prisma } from '@iziresto/database'
import { authenticate } from '../../middlewares/auth.middleware'
import crypto from 'crypto'

function verifyToken(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret })
    return result.valid
  } catch {
    return false
  }
}

function generateOtpAuthUri(email: string, secret: string): string {
  return `otpauth://totp/IziResto:${encodeURIComponent(email)}?secret=${secret}&issuer=IziResto&algorithm=SHA1&digits=6&period=30`
}

const router = Router()

router.use(authenticate)

router.get('/status', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorVerifiedAt: true,
      }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' })
    }

    res.json({
      success: true,
      data: {
        enabled: user.twoFactorEnabled,
        verifiedAt: user.twoFactorVerifiedAt,
      }
    })
  } catch (error) {
    console.error('2FA status error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.post('/setup', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' })
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ 
        success: false, 
        error: 'ALREADY_ENABLED',
        message: '2FA est deja active' 
      })
    }

    const secret = generateSecret()
    
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret }
    })

    const otpauth = generateOtpAuthUri(user.email, secret)
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth)

    res.json({
      success: true,
      data: {
        secret,
        qrCode: qrCodeDataUrl,
        otpauth,
      }
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { code } = req.body
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'CODE_REQUIRED' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
      }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' })
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ 
        success: false, 
        error: 'SETUP_REQUIRED',
        message: 'Veuillez d\'abord configurer la 2FA' 
      })
    }

    const isValid = verifyToken(code, user.twoFactorSecret)

    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'INVALID_CODE',
        message: 'Code invalide' 
      })
    }

    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorVerifiedAt: new Date(),
        twoFactorBackupCodes: backupCodes,
      }
    })

    res.json({
      success: true,
      data: {
        backupCodes,
        message: '2FA active avec succes'
      }
    })
  } catch (error) {
    console.error('2FA verify error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.post('/disable', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { code, password } = req.body
    if (!code || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'CODE_AND_PASSWORD_REQUIRED' 
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' })
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ 
        success: false, 
        error: 'NOT_ENABLED',
        message: '2FA n\'est pas active' 
      })
    }

    const bcrypt = await import('bcryptjs')
    const isPasswordValid = await bcrypt.default.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'INVALID_PASSWORD',
        message: 'Mot de passe incorrect' 
      })
    }

    const isCodeValid = verifyToken(code, user.twoFactorSecret!)
    const isBackupCode = user.twoFactorBackupCodes.includes(code.toUpperCase())

    if (!isCodeValid && !isBackupCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'INVALID_CODE',
        message: 'Code invalide' 
      })
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorVerifiedAt: null,
      }
    })

    res.json({
      success: true,
      message: '2FA desactive avec succes'
    })
  } catch (error) {
    console.error('2FA disable error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

router.post('/regenerate-backup-codes', async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    }

    const { code } = req.body
    if (!code) {
      return res.status(400).json({ success: false, error: 'CODE_REQUIRED' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' })
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ 
        success: false, 
        error: 'NOT_ENABLED' 
      })
    }

    const isCodeValid = verifyToken(code, user.twoFactorSecret!)
    const isBackupCode = user.twoFactorBackupCodes.includes(code.toUpperCase())

    if (!isCodeValid && !isBackupCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'INVALID_CODE' 
      })
    }

    const newBackupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: newBackupCodes }
    })

    res.json({
      success: true,
      data: { backupCodes: newBackupCodes }
    })
  } catch (error) {
    console.error('Regenerate backup codes error:', error)
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' })
  }
})

export { router as twoFactorRoutes }
