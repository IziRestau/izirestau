# Skill: Emails Transactionnels

## Quand utiliser ce skill
- Envoi d'emails (confirmation, reset password, factures)
- Templates email
- Configuration Resend

---

## Configuration

### Variables d'environnement
```bash
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@iziresto.com
```

---

## Service Email

```typescript
// src/services/email.service.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'noreply@iziresto.com'

export const emailService = {
  async send(options: {
    to: string | string[]
    subject: string
    html: string
    text?: string
  }) {
    return resend.emails.send({
      from: FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
  },

  async sendWelcome(email: string, name: string) {
    return this.send({
      to: email,
      subject: 'Bienvenue sur IziResto',
      html: templates.welcome({ name }),
    })
  },

  async sendPasswordReset(email: string, resetUrl: string) {
    return this.send({
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: templates.passwordReset({ resetUrl }),
    })
  },

  async sendOrderConfirmation(email: string, order: OrderData) {
    return this.send({
      to: email,
      subject: `Commande #${order.displayNumber} confirmée`,
      html: templates.orderConfirmation(order),
    })
  },

  async sendInvoice(email: string, invoice: InvoiceData, pdfUrl: string) {
    return this.send({
      to: email,
      subject: `Facture ${invoice.number}`,
      html: templates.invoice({ invoice, pdfUrl }),
    })
  },
}
```

---

## Templates Email

### Base Template
```typescript
// src/templates/email/base.ts
export function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IziResto</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #f97316;
    }
    .button {
      display: inline-block;
      background: #f97316;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">IziResto</div>
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} IziResto. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
`
}
```

### Templates spécifiques
```typescript
// src/templates/email/templates.ts
import { baseTemplate } from './base'

export const templates = {
  welcome({ name }: { name: string }) {
    return baseTemplate(`
      <h1>Bienvenue ${name} !</h1>
      <p>Merci de rejoindre IziResto. Votre compte a été créé avec succès.</p>
      <p>Vous pouvez maintenant accéder à votre tableau de bord et commencer à gérer vos restaurants.</p>
      <p style="text-align: center; margin-top: 24px;">
        <a href="${process.env.FRONTEND_URL}/login" class="button">
          Accéder au tableau de bord
        </a>
      </p>
    `)
  },

  passwordReset({ resetUrl }: { resetUrl: string }) {
    return baseTemplate(`
      <h1>Réinitialisation du mot de passe</h1>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
      <p style="text-align: center; margin-top: 24px;">
        <a href="${resetUrl}" class="button">
          Réinitialiser le mot de passe
        </a>
      </p>
      <p style="color: #666; font-size: 14px; margin-top: 24px;">
        Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
      </p>
    `)
  },

  orderConfirmation(order: OrderData) {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
            ${item.quantity}x ${item.name}
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">
            ${formatCurrency(item.total)}
          </td>
        </tr>
      `
      )
      .join('')

    return baseTemplate(`
      <h1>Commande confirmée</h1>
      <p>Merci pour votre commande chez <strong>${order.restaurantName}</strong>.</p>
      
      <div style="background: #f9f9f9; padding: 16px; border-radius: 6px; margin: 24px 0;">
        <p style="margin: 0;"><strong>Commande #${order.displayNumber}</strong></p>
        <p style="margin: 8px 0 0; color: #666;">
          ${order.serviceType === 'DELIVERY' ? 'Livraison' : 'À emporter'}
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        ${itemsHtml}
        <tr>
          <td style="padding: 12px 0; font-weight: bold;">Total</td>
          <td style="padding: 12px 0; text-align: right; font-weight: bold;">
            ${formatCurrency(order.total)}
          </td>
        </tr>
      </table>

      ${
        order.serviceType === 'DELIVERY'
          ? `
        <div style="margin-top: 24px;">
          <p><strong>Adresse de livraison :</strong></p>
          <p style="color: #666;">${order.deliveryAddress}</p>
        </div>
      `
          : ''
      }

      <p style="text-align: center; margin-top: 24px;">
        <a href="${process.env.FRONTEND_URL}/track/${order.id}" class="button">
          Suivre ma commande
        </a>
      </p>
    `)
  },

  invoice({ invoice, pdfUrl }: { invoice: InvoiceData; pdfUrl: string }) {
    return baseTemplate(`
      <h1>Votre facture</h1>
      <p>Veuillez trouver ci-joint votre facture <strong>${invoice.number}</strong>.</p>
      
      <div style="background: #f9f9f9; padding: 16px; border-radius: 6px; margin: 24px 0;">
        <p style="margin: 0;"><strong>Montant : ${formatCurrency(invoice.amount)}</strong></p>
        <p style="margin: 8px 0 0; color: #666;">
          Période : ${formatDate(invoice.periodStart)} - ${formatDate(invoice.periodEnd)}
        </p>
      </div>

      <p style="text-align: center; margin-top: 24px;">
        <a href="${pdfUrl}" class="button">
          Télécharger la facture
        </a>
      </p>
    `)
  },

  newSiteCreated({ siteName, subdomain }: { siteName: string; subdomain: string }) {
    return baseTemplate(`
      <h1>Nouveau site créé</h1>
      <p>Votre site <strong>${siteName}</strong> a été créé avec succès.</p>
      
      <div style="background: #f9f9f9; padding: 16px; border-radius: 6px; margin: 24px 0;">
        <p style="margin: 0;"><strong>URL :</strong></p>
        <p style="margin: 8px 0 0;">
          <a href="https://${subdomain}.iziresto.com">
            https://${subdomain}.iziresto.com
          </a>
        </p>
      </div>

      <p style="text-align: center; margin-top: 24px;">
        <a href="${process.env.FRONTEND_URL}/reseller/sites" class="button">
          Gérer mes sites
        </a>
      </p>
    `)
  },
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
```

---

## Utilisation

### Dans un controller
```typescript
// Après création d'un compte
await emailService.sendWelcome(user.email, user.firstName)

// Après une commande
await emailService.sendOrderConfirmation(customer.email, {
  id: order.id,
  displayNumber: order.displayNumber,
  restaurantName: restaurant.name,
  items: order.items,
  total: order.total,
  serviceType: order.serviceType,
  deliveryAddress: order.deliveryAddress,
})

// Reset password
const resetToken = generateResetToken()
const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
await emailService.sendPasswordReset(user.email, resetUrl)
```

---

## Types d'emails

| Email | Déclencheur |
|-------|-------------|
| Welcome | Inscription |
| Password Reset | Demande reset |
| Order Confirmation | Commande payée |
| Order Status | Changement statut |
| Invoice | Facture générée |
| Site Created | Nouveau site |
| License Expiring | 7j avant expiration |
| Payment Failed | Échec paiement |
