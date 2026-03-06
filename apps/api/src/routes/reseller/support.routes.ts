import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { z } from 'zod'
import { sendSupportTicketCreatedEmail, sendSupportNewMessageEmail } from '../../services/email.service'

const PLATFORM_URL = process.env.PLATFORM_URL || 'http://localhost:3000'
const ADMIN_SUPPORT_EMAIL = process.env.ADMIN_SUPPORT_EMAIL || 'support@iziresto.com'

const router = Router()

const createTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  category: z.enum(['BILLING', 'TECHNICAL', 'FEATURE_REQUEST', 'ACCOUNT', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  message: z.string().min(10),
})

const addMessageSchema = z.object({
  content: z.string().min(1),
})

function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TKT-${timestamp}-${random}`
}

router.get('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const member = await prisma.resellerMember.findFirst({
      where: { userId },
      include: { organization: true },
    })

    if (!member) {
      return next(new AppError('Membre non trouve', 404, 'MEMBER_NOT_FOUND'))
    }

    const { status, category } = req.query

    const where: any = {
      resellerOrgId: member.organizationId,
      ticketType: 'RESELLER_TO_PLATFORM',
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (category && category !== 'all') {
      where.category = category
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const stats = {
      total: await prisma.supportTicket.count({ 
        where: { resellerOrgId: member.organizationId, ticketType: 'RESELLER_TO_PLATFORM' } 
      }),
      open: await prisma.supportTicket.count({ 
        where: { resellerOrgId: member.organizationId, ticketType: 'RESELLER_TO_PLATFORM', status: 'OPEN' } 
      }),
      inProgress: await prisma.supportTicket.count({ 
        where: { resellerOrgId: member.organizationId, ticketType: 'RESELLER_TO_PLATFORM', status: 'IN_PROGRESS' } 
      }),
      resolved: await prisma.supportTicket.count({ 
        where: { resellerOrgId: member.organizationId, ticketType: 'RESELLER_TO_PLATFORM', status: 'RESOLVED' } 
      }),
    }

    res.json({
      success: true,
      data: { tickets, stats },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/tickets/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const member = await prisma.resellerMember.findFirst({
      where: { userId },
    })

    if (!member) {
      return next(new AppError('Membre non trouve', 404, 'MEMBER_NOT_FOUND'))
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        resellerOrgId: member.organizationId,
        ticketType: 'RESELLER_TO_PLATFORM',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                userType: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) {
      return next(new AppError('Ticket non trouve', 404, 'TICKET_NOT_FOUND'))
    }

    res.json({
      success: true,
      data: ticket,
    })
  } catch (error) {
    next(error)
  }
})

router.post('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const member = await prisma.resellerMember.findFirst({
      where: { userId },
    })

    if (!member) {
      return next(new AppError('Membre non trouve', 404, 'MEMBER_NOT_FOUND'))
    }

    const validation = createTicketSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError('Donnees invalides', 400, 'VALIDATION_ERROR'))
    }

    const { subject, category, priority, message } = validation.data

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    })

    const organization = await prisma.resellerOrganization.findUnique({
      where: { id: member.organizationId },
      select: { name: true },
    })

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        ticketType: 'RESELLER_TO_PLATFORM',
        createdById: userId,
        resellerOrgId: member.organizationId,
        subject,
        category,
        priority,
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderId: userId,
            content: message,
            isFromAdmin: false,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    const ticketLink = `${PLATFORM_URL}/reseller/support/${ticket.id}`

    if (user?.email) {
      sendSupportTicketCreatedEmail(
        user.email,
        user.firstName,
        ticket.ticketNumber,
        subject,
        category,
        ticketLink,
        false
      ).catch(err => console.error('[Support] Email error:', err))
    }

    sendSupportTicketCreatedEmail(
      ADMIN_SUPPORT_EMAIL,
      'Admin',
      ticket.ticketNumber,
      subject,
      category,
      `${PLATFORM_URL}/platform/support/${ticket.id}`,
      true,
      organization?.name
    ).catch(err => console.error('[Support] Admin email error:', err))

    res.status(201).json({
      success: true,
      data: ticket,
    })
  } catch (error) {
    next(error)
  }
})

router.post('/tickets/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const member = await prisma.resellerMember.findFirst({
      where: { userId },
    })

    if (!member) {
      return next(new AppError('Membre non trouve', 404, 'MEMBER_NOT_FOUND'))
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        resellerOrgId: member.organizationId,
        ticketType: 'RESELLER_TO_PLATFORM',
      },
    })

    if (!ticket) {
      return next(new AppError('Ticket non trouve', 404, 'TICKET_NOT_FOUND'))
    }

    if (ticket.status === 'CLOSED') {
      return next(new AppError('Ce ticket est ferme', 400, 'TICKET_CLOSED'))
    }

    const validation = addMessageSchema.safeParse(req.body)
    if (!validation.success) {
      return next(new AppError('Message invalide', 400, 'VALIDATION_ERROR'))
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    })

    const message = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: userId,
        content: validation.data.content,
        isFromAdmin: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        lastMessageAt: new Date(),
        status: ticket.status === 'WAITING_REPLY' ? 'IN_PROGRESS' : ticket.status,
      },
    })

    const senderName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'
    sendSupportNewMessageEmail(
      ADMIN_SUPPORT_EMAIL,
      'Admin',
      ticket.ticketNumber,
      ticket.subject,
      senderName,
      validation.data.content,
      `${PLATFORM_URL}/platform/support/${ticket.id}`,
      false
    ).catch(err => console.error('[Support] Admin message email error:', err))

    res.status(201).json({
      success: true,
      data: message,
    })
  } catch (error) {
    next(error)
  }
})

router.post('/tickets/:id/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const member = await prisma.resellerMember.findFirst({
      where: { userId },
    })

    if (!member) {
      return next(new AppError('Membre non trouve', 404, 'MEMBER_NOT_FOUND'))
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        resellerOrgId: member.organizationId,
        ticketType: 'RESELLER_TO_PLATFORM',
      },
    })

    if (!ticket) {
      return next(new AppError('Ticket non trouve', 404, 'TICKET_NOT_FOUND'))
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    })

    res.json({
      success: true,
      data: updatedTicket,
    })
  } catch (error) {
    next(error)
  }
})

router.post('/tickets/:id/reopen', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const member = await prisma.resellerMember.findFirst({
      where: { userId },
    })

    if (!member) {
      return next(new AppError('Membre non trouve', 404, 'MEMBER_NOT_FOUND'))
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        resellerOrgId: member.organizationId,
        ticketType: 'RESELLER_TO_PLATFORM',
      },
    })

    if (!ticket) {
      return next(new AppError('Ticket non trouve', 404, 'TICKET_NOT_FOUND'))
    }

    if (ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED') {
      return next(new AppError('Ce ticket est deja ouvert', 400, 'TICKET_ALREADY_OPEN'))
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'OPEN',
        closedAt: null,
        resolvedAt: null,
      },
    })

    res.json({
      success: true,
      data: updatedTicket,
    })
  } catch (error) {
    next(error)
  }
})

export default router
