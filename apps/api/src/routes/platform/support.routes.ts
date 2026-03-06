import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '@iziresto/database'
import { AppError } from '../../middlewares/error.middleware'
import { z } from 'zod'
import { sendSupportNewMessageEmail } from '../../services/email.service'

const PLATFORM_URL = process.env.PLATFORM_URL || 'http://localhost:3000'

const router = Router()

const addMessageSchema = z.object({
  content: z.string().min(1),
})

router.get('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query

    const where: Record<string, unknown> = {
      ticketType: 'RESELLER_TO_PLATFORM',
    }

    if (status && status !== 'all') {
      where.status = status as string
    }

    const [tickets, total, open, inProgress, resolved] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          resellerOrg: {
            select: { id: true, name: true },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.supportTicket.count({ where: { ticketType: 'RESELLER_TO_PLATFORM' } }),
      prisma.supportTicket.count({ where: { ticketType: 'RESELLER_TO_PLATFORM', status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { ticketType: 'RESELLER_TO_PLATFORM', status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { ticketType: 'RESELLER_TO_PLATFORM', status: 'RESOLVED' } }),
    ])

    res.json({
      success: true,
      data: {
        tickets,
        stats: { total, open, inProgress, resolved },
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/tickets/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        ticketType: 'RESELLER_TO_PLATFORM',
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
        },
        resellerOrg: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true, userType: true },
            },
          },
        },
      },
    })

    if (!ticket) {
      return next(new AppError('Ticket non trouve', 404, 'TICKET_NOT_FOUND'))
    }

    res.json({ success: true, data: ticket })
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

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        ticketType: 'RESELLER_TO_PLATFORM',
      },
      include: {
        createdBy: { select: { email: true, firstName: true } },
        resellerOrg: { select: { name: true } },
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

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, isSuperAdmin: true },
    })

    if (!admin?.isSuperAdmin) {
      return next(new AppError('Acces refuse', 403, 'FORBIDDEN'))
    }

    const message = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: userId,
        content: validation.data.content,
        isFromAdmin: true,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    })

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        lastMessageAt: new Date(),
        status: 'WAITING_REPLY',
      },
    })

    if (ticket.createdBy?.email) {
      const senderName = `${admin.firstName} ${admin.lastName}`
      sendSupportNewMessageEmail(
        ticket.createdBy.email,
        ticket.createdBy.firstName,
        ticket.ticketNumber,
        ticket.subject,
        senderName,
        validation.data.content,
        `${PLATFORM_URL}/reseller/support/${ticket.id}`,
        true
      ).catch(err => console.error('[Support] Email error:', err))
    }

    res.status(201).json({ success: true, data: message })
  } catch (error) {
    next(error)
  }
})

router.post('/tickets/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      return next(new AppError('Non autorise', 401, 'UNAUTHORIZED'))
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        ticketType: 'RESELLER_TO_PLATFORM',
      },
    })

    if (!ticket) {
      return next(new AppError('Ticket non trouve', 404, 'TICKET_NOT_FOUND'))
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    })

    res.json({ success: true, data: updated })
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

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        ticketType: 'RESELLER_TO_PLATFORM',
      },
    })

    if (!ticket) {
      return next(new AppError('Ticket non trouve', 404, 'TICKET_NOT_FOUND'))
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    })

    res.json({ success: true, data: updated })
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

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        ticketType: 'RESELLER_TO_PLATFORM',
      },
    })

    if (!ticket) {
      return next(new AppError('Ticket non trouve', 404, 'TICKET_NOT_FOUND'))
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'OPEN',
        resolvedAt: null,
        closedAt: null,
      },
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

export { router as platformSupportRoutes }
