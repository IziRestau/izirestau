import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { render } from '@react-email/components'
import { PasswordResetEmail } from '../emails/password-reset'
import { WelcomeEmail } from '../emails/welcome'
import { InvitationEmail } from '../emails/invitation'
import { InvoiceReminderEmail } from '../emails/invoice-reminder'
import { EmailVerificationEmail } from '../emails/email-verification'
import { SupportTicketCreatedEmail } from '../emails/support-ticket-created'
import { SupportNewMessageEmail } from '../emails/support-new-message'
import { ResellerInvitationEmail } from '../emails/reseller-invitation'
import { StaffInvitationEmail } from '../emails/staff-invitation'
import { ReceiptEmail } from '../emails/receipt-email'
import { LoyaltyPointsEarnedEmail } from '../emails/loyalty-points-earned'
import { LoyaltyPointsRedeemedEmail } from '../emails/loyalty-points-redeemed'
import { CampaignEmail } from '../emails/campaign-email'
import { prisma } from '@iziresto/database'

const FROM_EMAIL = process.env.EMAIL_FROM || 'IziResto <noreply@iziresto.com>'

const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
})

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Types pour les templates personnalisés
type RestaurantEmailType = 
  | 'ORDER_CONFIRMATION'
  | 'ORDER_READY'
  | 'ORDER_DELIVERED'
  | 'LOYALTY_POINTS_EARNED'
  | 'LOYALTY_POINTS_REDEEMED'
  | 'WELCOME'
  | 'BIRTHDAY'
  | 'RECEIPT'

interface CustomTemplateVariables {
  firstName?: string
  lastName?: string
  orderNumber?: string
  total?: string
  restaurantName?: string
  pointsEarned?: number
  totalPoints?: number
  pointsUsed?: number
  discount?: string
  remainingPoints?: number
  bonusPoints?: number
}

/**
 * Récupère un template personnalisé pour un restaurant
 */
async function getCustomTemplate(restaurantId: string, type: RestaurantEmailType) {
  try {
    const template = await prisma.restaurantEmailTemplate.findUnique({
      where: {
        restaurantId_type: {
          restaurantId,
          type: type as never,
        },
      },
    })
    return template?.isActive ? template : null
  } catch {
    return null
  }
}

/**
 * Remplace les variables dans un template
 */
function replaceTemplateVariables(content: string, variables: CustomTemplateVariables): string {
  let result = content
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }
  }
  return result
}

/**
 * Envoie un email avec un template HTML simple (pour les templates personnalisés)
 */
async function sendHtmlEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (resend) {
    try {
      const data = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      })
      console.log(`[Email Service] Sent custom template via Resend to: ${to}`)
      return { success: true, data }
    } catch (error) {
      console.error('[Email Service] Resend error:', error)
      return { success: false, error }
    }
  }

  try {
    const info = await smtpTransport.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })
    console.log(`[Email Service] Sent custom template via MailDev to: ${to}, messageId: ${info.messageId}`)
    return { success: true, data: { id: info.messageId } }
  } catch (error) {
    console.error('[Email Service] SMTP error:', error)
    return { success: false, error }
  }
}

interface SendEmailOptions {
  to: string
  subject: string
  react: React.ReactElement
}

async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const html = await render(react)

  if (resend) {
    try {
      const data = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      })
      console.log(`[Email Service] Sent via Resend to: ${to}`)
      return { success: true, data }
    } catch (error) {
      console.error('[Email Service] Resend error:', error)
      return { success: false, error }
    }
  }

  try {
    const info = await smtpTransport.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })
    console.log(`[Email Service] Sent via MailDev to: ${to}, messageId: ${info.messageId}`)
    return { success: true, data: { id: info.messageId } }
  } catch (error) {
    console.error('[Email Service] SMTP error:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetLink: string
) {
  return sendEmail({
    to,
    subject: 'Reinitialisation de votre mot de passe - IziResto',
    react: PasswordResetEmail({ firstName, resetLink }),
  })
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string
) {
  return sendEmail({
    to,
    subject: 'Bienvenue sur IziResto !',
    react: WelcomeEmail({ firstName }),
  })
}

export async function sendInvitationEmail(
  to: string,
  firstName: string,
  resellerName: string,
  inviteLink: string
) {
  return sendEmail({
    to,
    subject: `${resellerName} vous invite a rejoindre IziResto`,
    react: InvitationEmail({ firstName, resellerName, inviteLink }),
  })
}

export async function sendInvoiceReminderEmail(
  to: string,
  clientName: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  organizationName: string,
  isOverdue: boolean = false
) {
  const subject = isOverdue 
    ? `Facture ${invoiceNumber} en retard de paiement`
    : `Rappel : Facture ${invoiceNumber} a regler`

  return sendEmail({
    to,
    subject,
    react: InvoiceReminderEmail({ 
      clientName, 
      invoiceNumber, 
      amount, 
      dueDate, 
      organizationName,
      isOverdue 
    }),
  })
}

export async function sendEmailVerificationEmail(
  to: string,
  firstName: string,
  verificationLink: string
) {
  return sendEmail({
    to,
    subject: 'Verifiez votre adresse email - IziResto',
    react: EmailVerificationEmail({ firstName, verificationLink }),
  })
}

export async function sendSupportTicketCreatedEmail(
  to: string,
  firstName: string,
  ticketNumber: string,
  subject: string,
  category: string,
  ticketLink: string,
  isAdmin: boolean = false,
  organizationName?: string
) {
  const emailSubject = isAdmin
    ? `[Support] Nouveau ticket: ${ticketNumber}`
    : `Votre ticket ${ticketNumber} a ete cree`

  return sendEmail({
    to,
    subject: emailSubject,
    react: SupportTicketCreatedEmail({
      firstName,
      ticketNumber,
      subject,
      category,
      ticketLink,
      isAdmin,
      organizationName,
    }),
  })
}

export async function sendSupportNewMessageEmail(
  to: string,
  firstName: string,
  ticketNumber: string,
  subject: string,
  senderName: string,
  messagePreview: string,
  ticketLink: string,
  isFromAdmin: boolean
) {
  return sendEmail({
    to,
    subject: `Nouvelle reponse sur le ticket ${ticketNumber}`,
    react: SupportNewMessageEmail({
      firstName,
      ticketNumber,
      subject,
      senderName,
      messagePreview,
      ticketLink,
      isFromAdmin,
    }),
  })
}

export async function sendResellerInvitationEmail({
  to,
  inviteUrl,
}: {
  to: string
  inviteToken: string
  inviteUrl: string
}) {
  return sendEmail({
    to,
    subject: 'Invitation a rejoindre IziResto en tant que revendeur',
    react: ResellerInvitationEmail({ inviteLink: inviteUrl }),
  })
}

export async function sendStaffInvitationEmail({
  to,
  firstName,
  restaurantName,
  role,
  inviterName,
  inviteLink,
}: {
  to: string
  firstName: string
  restaurantName: string
  role: string
  inviterName: string
  inviteLink: string
}) {
  return sendEmail({
    to,
    subject: `${restaurantName} vous invite a rejoindre l'equipe`,
    react: StaffInvitationEmail({ firstName, restaurantName, role, inviterName, inviteLink }),
  })
}

interface ReceiptItem {
  name: string
  quantity: number
  total: number
}

// ============================================
// LOYALTY EMAILS
// ============================================

export async function sendLoyaltyPointsEarnedEmail({
  to,
  customerName,
  restaurantName,
  restaurantLogo,
  primaryColor,
  pointsEarned,
  totalPoints,
  orderNumber,
  orderTotal,
  accountUrl,
  restaurantId,
}: {
  to: string
  customerName: string
  restaurantName: string
  restaurantLogo?: string
  primaryColor?: string
  pointsEarned: number
  totalPoints: number
  orderNumber: string
  orderTotal: string
  accountUrl?: string
  restaurantId?: string
}) {
  // Vérifier si un template personnalisé existe
  if (restaurantId) {
    const customTemplate = await getCustomTemplate(restaurantId, 'LOYALTY_POINTS_EARNED')
    if (customTemplate) {
      const variables: CustomTemplateVariables = {
        firstName: customerName,
        restaurantName,
        pointsEarned,
        totalPoints,
        orderNumber,
        total: orderTotal,
      }
      const subject = replaceTemplateVariables(customTemplate.subject, variables)
      const content = replaceTemplateVariables(customTemplate.content, variables)
      return sendHtmlEmail({ to, subject, html: content })
    }
  }

  return sendEmail({
    to,
    subject: `Vous avez gagné ${pointsEarned} points chez ${restaurantName}`,
    react: LoyaltyPointsEarnedEmail({
      customerName,
      restaurantName,
      restaurantLogo,
      primaryColor,
      pointsEarned,
      totalPoints,
      orderNumber,
      orderTotal,
      accountUrl,
    }),
  })
}

export async function sendLoyaltyPointsRedeemedEmail({
  to,
  customerName,
  restaurantName,
  restaurantLogo,
  primaryColor,
  pointsUsed,
  discountAmount,
  remainingPoints,
  orderNumber,
  accountUrl,
}: {
  to: string
  customerName: string
  restaurantName: string
  restaurantLogo?: string
  primaryColor?: string
  pointsUsed: number
  discountAmount: string
  remainingPoints: number
  orderNumber: string
  accountUrl?: string
}) {
  return sendEmail({
    to,
    subject: `Points utilisés chez ${restaurantName}`,
    react: LoyaltyPointsRedeemedEmail({
      customerName,
      restaurantName,
      restaurantLogo,
      primaryColor,
      pointsUsed,
      discountAmount,
      remainingPoints,
      orderNumber,
      accountUrl,
    }),
  })
}

export async function sendReceiptEmail({
  to,
  customerName,
  restaurantName,
  restaurantLogo,
  restaurantAddress,
  restaurantPhone,
  restaurantEmail,
  primaryColor,
  receiptNumber,
  orderNumber,
  date,
  items,
  subtotal,
  taxAmount,
  discount,
  deliveryFee,
  total,
  receiptType,
  viewReceiptUrl,
  thankYouMessage,
}: {
  to: string
  customerName: string
  restaurantName: string
  restaurantLogo?: string
  restaurantAddress?: string
  restaurantPhone?: string
  restaurantEmail?: string
  primaryColor?: string
  receiptNumber: string
  orderNumber: string
  date: string
  items: ReceiptItem[]
  subtotal: number
  taxAmount: number
  discount?: number
  deliveryFee?: number
  total: number
  receiptType: 'TICKET' | 'INVOICE_SIMPLE' | 'INVOICE_FULL'
  viewReceiptUrl?: string
  thankYouMessage?: string
}) {
  const typeLabel = receiptType === 'INVOICE_FULL' ? 'Facture' : 
                    receiptType === 'INVOICE_SIMPLE' ? 'Facture simplifiée' : 'Ticket de caisse'
  
  return sendEmail({
    to,
    subject: `${typeLabel} ${receiptNumber} - ${restaurantName}`,
    react: ReceiptEmail({
      customerName,
      restaurantName,
      restaurantLogo,
      restaurantAddress,
      restaurantPhone,
      restaurantEmail,
      primaryColor,
      receiptNumber,
      orderNumber,
      date,
      items,
      subtotal,
      taxAmount,
      discount,
      deliveryFee,
      total,
      receiptType,
      viewReceiptUrl,
      thankYouMessage,
    }),
  })
}

// ============================================
// CAMPAIGN EMAILS
// ============================================

interface CampaignRecipient {
  id: string
  email: string
  firstName: string
  lastName: string
  loyaltyPoints?: number
}

export async function sendCampaignEmails(
  campaignId: string,
  subject: string,
  content: string,
  restaurantName: string,
  recipients: CampaignRecipient[],
  fromEmail?: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  const apiUrl = process.env.API_URL || 'http://localhost:4000'

  for (const recipient of recipients) {
    // Récupérer l'ID du destinataire pour le tracking
    const recipientRecord = await prisma.emailCampaignRecipient.findFirst({
      where: { campaignId, customerId: recipient.id },
      select: { id: true },
    })

    const recipientId = recipientRecord?.id
    const unsubscribeUrl = `${apiUrl}/api/store/unsubscribe?email=${encodeURIComponent(recipient.email)}`
    const trackingPixelUrl = recipientId ? `${apiUrl}/api/store/email/track/open/${recipientId}` : undefined

    try {
      const result = await sendEmail({
        to: recipient.email,
        subject,
        react: CampaignEmail({
          content,
          restaurantName,
          firstName: recipient.firstName,
          lastName: recipient.lastName,
          loyaltyPoints: recipient.loyaltyPoints || 0,
          unsubscribeUrl,
          trackingPixelUrl,
        }),
      })

      if (result.success) {
        sent++
        // Mettre à jour le statut du destinataire
        await prisma.emailCampaignRecipient.updateMany({
          where: { campaignId, customerId: recipient.id },
          data: { status: 'SENT', sentAt: new Date() },
        })
      } else {
        failed++
        await prisma.emailCampaignRecipient.updateMany({
          where: { campaignId, customerId: recipient.id },
          data: { status: 'BOUNCED', bouncedAt: new Date() },
        })
      }
    } catch (error) {
      console.error(`[Campaign Email] Failed to send to ${recipient.email}:`, error)
      failed++
      await prisma.emailCampaignRecipient.updateMany({
        where: { campaignId, customerId: recipient.id },
        data: { status: 'BOUNCED', bouncedAt: new Date() },
      })
    }
  }

  return { sent, failed }
}
