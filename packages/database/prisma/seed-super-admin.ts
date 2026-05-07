import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'admin@izirestau.online'
const ADMIN_PASSWORD = 'Iz1Restau@SuperAdmin2026!'

async function main() {
  console.log('[seed-super-admin] starting...')

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      isSuperAdmin: true,
      userType: 'SUPER_ADMIN',
      emailVerified: true,
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      userType: 'SUPER_ADMIN',
      isSuperAdmin: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })

  console.log(`[seed-super-admin] OK -> ${admin.email} (id=${admin.id})`)
}

main()
  .catch((e) => {
    console.error('[seed-super-admin] failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
