import { Router } from 'express'
import { register, login, login2FA, logout, refresh, me } from '../controllers/auth.controller'
import { setupPassword } from '../controllers/invitation.controller'
import { forgotPassword, resetPassword } from '../controllers/password.controller'
import { validate } from '../middlewares/validate.middleware'
import { authenticate } from '../middlewares/auth.middleware'
import { authRateLimit, strictRateLimit } from '../middlewares/rate-limit.middleware'
import { registerSchema, loginSchema } from '../validators/auth.validator'

const router = Router()

router.post('/register', authRateLimit, validate(registerSchema), register)
router.post('/login', authRateLimit, validate(loginSchema), login)
router.post('/login/2fa', authRateLimit, login2FA)
router.post('/logout', logout)
router.post('/refresh', refresh)
router.get('/me', authenticate, me)
router.post('/setup-password', strictRateLimit, setupPassword)
router.post('/forgot-password', strictRateLimit, forgotPassword)
router.post('/reset-password', strictRateLimit, resetPassword)

export { router as authRoutes }
