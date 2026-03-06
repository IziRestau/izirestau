import { Liquid } from 'liquidjs'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Types pour les données de template
interface ReceiptData {
  restaurant: {
    name: string
    address: string
    addressLine2?: string
    city: string
    postalCode: string
    phone: string
    email?: string
    siret?: string
    vatNumber?: string
    logo?: string
  }
  receipt: {
    receiptNumber: string
    createdAt: Date
    type: string
    signature?: string
  }
  order: {
    orderNumber: string
    serviceType: string
    paymentMethod: string
    customerNotes?: string
  }
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    unitPriceHT: number
    total: number
    totalHT: number
    notes?: string
    modifiers: Array<{
      name: string
      price: number
    }>
  }>
  totals: {
    subtotal: number
    subtotalHT: number
    taxes: Array<{
      rate: number
      amount: number
    }>
    discount: number
    deliveryFee: number
    tip: number
    total: number
  }
  customer?: {
    name: string
    email?: string
    phone?: string
    address?: string
  }
  cashier?: {
    firstName: string
    lastName: string
  }
  settings: {
    logo?: string
    thankYouMessage?: string
    footerText?: string
    showQrCode?: boolean
    primaryColor?: string
    fontFamily?: string
  }
  qrCodeUrl?: string
}

// Labels pour les types de service
const serviceTypeLabels: Record<string, string> = {
  DELIVERY: 'Livraison',
  PICKUP: 'À emporter',
  DINE_IN: 'Sur place',
}

// Labels pour les méthodes de paiement
const paymentMethodLabels: Record<string, string> = {
  CASH: 'Espèces',
  CARD: 'Carte bancaire',
  CARD_ONLINE: 'Carte en ligne',
  APPLE_PAY: 'Apple Pay',
  GOOGLE_PAY: 'Google Pay',
  OTHER: 'Autre',
}

class TemplateService {
  private engine: Liquid

  constructor() {
    this.engine = new Liquid({
      strictFilters: false,
      strictVariables: false,
    })

    this.registerFilters()
  }

  private registerFilters() {
    // Filtre pour formater les montants en devise
    this.engine.registerFilter('money', (value: number | string, currency = 'XOF') => {
      const num = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(num)) return '0'
      
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: currency === 'XOF' ? 0 : 2,
      }).format(num)
    })

    // Filtre pour formater les montants courts (sans symbole de devise)
    this.engine.registerFilter('money_short', (value: number | string, currency = 'XOF') => {
      const num = typeof value === 'string' ? parseFloat(value) : value
      if (isNaN(num)) return '0'
      
      const formatted = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: currency === 'XOF' ? 0 : 2,
      }).format(num)
      
      return currency === 'XOF' ? `${formatted} F` : `${formatted} €`
    })

    // Filtre pour formater les dates
    this.engine.registerFilter('date', (value: Date | string, formatStr = '%d/%m/%Y') => {
      const date = typeof value === 'string' ? new Date(value) : value
      if (!(date instanceof Date) || isNaN(date.getTime())) return ''
      
      // Convertir le format strftime en format date-fns
      const dateFormat = formatStr
        .replace('%d', 'dd')
        .replace('%m', 'MM')
        .replace('%Y', 'yyyy')
        .replace('%H', 'HH')
        .replace('%M', 'mm')
        .replace('%S', 'ss')
        .replace(' à ', "' à '")
      
      return format(date, dateFormat, { locale: fr })
    })

    // Filtre pour le type de service
    this.engine.registerFilter('service_type', (value: string) => {
      return serviceTypeLabels[value] || value
    })

    // Filtre pour la méthode de paiement
    this.engine.registerFilter('payment_method', (value: string) => {
      return paymentMethodLabels[value] || value
    })

    // Filtre pour tronquer le texte
    this.engine.registerFilter('truncate', (value: string, length = 20) => {
      if (!value || value.length <= length) return value
      return value.substring(0, length) + '...'
    })

    // Filtre pour extraire le premier caractère
    this.engine.registerFilter('slice', (value: string, start: number, end?: number) => {
      if (!value) return ''
      return end !== undefined ? value.slice(start, end) : value.slice(start, start + 1)
    })

    // Filtre par défaut
    this.engine.registerFilter('default', (value: unknown, defaultValue: unknown) => {
      return value ?? defaultValue
    })
  }

  /**
   * Rend un template Liquid avec les données fournies
   */
  async render(template: string, data: ReceiptData): Promise<string> {
    try {
      return await this.engine.parseAndRender(template, data)
    } catch (error) {
      console.error('Error rendering template:', error)
      throw new Error(`Erreur lors du rendu du template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Rend un template complet avec CSS intégré
   */
  async renderWithStyles(
    htmlTemplate: string,
    cssStyles: string | null,
    data: ReceiptData
  ): Promise<string> {
    const renderedHtml = await this.render(htmlTemplate, data)
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket ${data.receipt.receiptNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    ${cssStyles || ''}
  </style>
</head>
<body>
  ${renderedHtml}
</body>
</html>
`
  }

  /**
   * Valide un template Liquid
   */
  async validate(template: string): Promise<{ valid: boolean; error?: string }> {
    try {
      await this.engine.parse(template)
      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Erreur de syntaxe dans le template',
      }
    }
  }

  /**
   * Génère des données de prévisualisation pour tester un template
   */
  getPreviewData(overrides?: {
    restaurant?: Partial<ReceiptData['restaurant']>
    settings?: Partial<ReceiptData['settings']>
  }): ReceiptData {
    const now = new Date()
    
    const defaultRestaurant = {
      name: 'Restaurant Demo',
      address: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      phone: '01 23 45 67 89',
      email: 'contact@restaurant-demo.com',
      siret: '123 456 789 00012',
      vatNumber: 'FR12345678901',
    }

    const defaultSettings = {
      thankYouMessage: 'Merci de votre visite !',
      footerText: 'À bientôt',
      showQrCode: true,
      primaryColor: '#10b981',
    }

    return {
      restaurant: {
        ...defaultRestaurant,
        ...overrides?.restaurant,
      },
      receipt: {
        receiptNumber: `TK-${format(now, 'yyyyMMdd')}-0001`,
        createdAt: now,
        type: 'TICKET',
        signature: 'A3F2B1C4D5E6F7A8B9C0D1E2F3A4B5C6',
      },
      order: {
        orderNumber: 'ORD-001',
        serviceType: 'DINE_IN',
        paymentMethod: 'CARD',
      },
      items: [
        {
          name: 'Burger Classic',
          quantity: 2,
          unitPrice: 12000,
          unitPriceHT: 10909,
          total: 24000,
          totalHT: 21818,
          modifiers: [
            { name: 'Supplément fromage', price: 500 },
          ],
        },
        {
          name: 'Frites maison',
          quantity: 1,
          unitPrice: 3500,
          unitPriceHT: 3182,
          total: 3500,
          totalHT: 3182,
          modifiers: [],
        },
        {
          name: 'Coca-Cola 33cl',
          quantity: 2,
          unitPrice: 2000,
          unitPriceHT: 1818,
          total: 4000,
          totalHT: 3636,
          modifiers: [],
        },
      ],
      totals: {
        subtotal: 32000,
        subtotalHT: 29091,
        taxes: [
          { rate: 10, amount: 2909 },
        ],
        discount: 0,
        deliveryFee: 0,
        tip: 0,
        total: 32000,
      },
      cashier: {
        firstName: 'Jean',
        lastName: 'Dupont',
      },
      settings: {
        ...defaultSettings,
        ...overrides?.settings,
      },
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=demo',
    }
  }
}

export const templateService = new TemplateService()
export type { ReceiptData }
