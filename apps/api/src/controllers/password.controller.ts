import { Request, Response } from 'express'
import { prisma } from '@iziresto/database'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '../services/email.service'

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Email requis',
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return res.json({
        success: true,
        message: 'Si un compte existe avec cet email, vous recevrez un lien de reinitialisation.',
      })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetExpires,
      },
    })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`

    await sendPasswordResetEmail(user.email, user.firstName, resetLink)

    return res.json({
      success: true,
      message: 'Si un compte existe avec cet email, vous recevrez un lien de reinitialisation.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Une erreur est survenue',
    })
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, email, password } = req.body

    if (!token || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Token, email et mot de passe requis',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Le mot de passe doit contenir au moins 8 caracteres',
      })
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        resetToken: resetTokenHash,
        resetExpires: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Le lien de reinitialisation est invalide ou a expire',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetExpires: null,
      },
    })

    return res.json({
      success: true,
      message: 'Votre mot de passe a ete reinitialise avec succes',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Une erreur est survenue',
    })
  }
}
