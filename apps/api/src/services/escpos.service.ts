import net from 'net'

interface PrinterConfig {
  type: 'network' | 'usb'
  host?: string
  port?: number
  width?: '58mm' | '80mm'
}

interface PrintJob {
  commands: Buffer
  printerConfig: PrinterConfig
}

const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

const CHARS_PER_LINE = {
  '58mm': 32,
  '80mm': 48,
}

class EscPosService {
  private buildInitCommands(): number[] {
    return [
      ESC, 0x40,       // Initialize printer
      ESC, 0x74, 0x10, // Select character code table (PC437)
    ]
  }

  private buildCutCommand(): number[] {
    return [
      GS, 0x56, 0x00,  // Full cut
    ]
  }

  private buildFeedCommand(lines: number = 3): number[] {
    return [
      ESC, 0x64, lines, // Feed n lines
    ]
  }

  private buildTextCommand(text: string, options: {
    align?: 'left' | 'center' | 'right'
    bold?: boolean
    doubleWidth?: boolean
    doubleHeight?: boolean
    underline?: boolean
  } = {}): number[] {
    const commands: number[] = []

    // Alignment
    if (options.align) {
      const alignCode = options.align === 'center' ? 1 : options.align === 'right' ? 2 : 0
      commands.push(ESC, 0x61, alignCode)
    }

    // Bold
    if (options.bold) {
      commands.push(ESC, 0x45, 1)
    }

    // Double width/height
    if (options.doubleWidth || options.doubleHeight) {
      let mode = 0
      if (options.doubleWidth) mode |= 0x20
      if (options.doubleHeight) mode |= 0x10
      commands.push(GS, 0x21, mode)
    }

    // Underline
    if (options.underline) {
      commands.push(ESC, 0x2d, 1)
    }

    // Text content (convert to CP437 compatible)
    const textBytes = this.encodeText(text)
    commands.push(...textBytes, LF)

    // Reset formatting
    if (options.bold) {
      commands.push(ESC, 0x45, 0)
    }
    if (options.doubleWidth || options.doubleHeight) {
      commands.push(GS, 0x21, 0)
    }
    if (options.underline) {
      commands.push(ESC, 0x2d, 0)
    }

    return commands
  }

  private encodeText(text: string): number[] {
    // Map French characters to CP437 equivalents
    const charMap: Record<string, number> = {
      'é': 0x82, 'è': 0x8a, 'ê': 0x88, 'ë': 0x89,
      'à': 0x85, 'â': 0x83, 'ä': 0x84,
      'ù': 0x97, 'û': 0x96, 'ü': 0x81,
      'ô': 0x93, 'ö': 0x94,
      'î': 0x8c, 'ï': 0x8b,
      'ç': 0x87,
      'É': 0x90, 'È': 0xd4, 'Ê': 0xd2, 'Ë': 0xd3,
      'À': 0xb7, 'Â': 0xb6,
      'Ù': 0xeb, 'Û': 0xea, 'Ü': 0x9a,
      'Ô': 0xe2,
      'Î': 0xd8, 'Ï': 0xd8,
      'Ç': 0x80,
      '€': 0xee,
      '°': 0xf8,
    }

    const bytes: number[] = []
    for (const char of text) {
      if (charMap[char]) {
        bytes.push(charMap[char])
      } else if (char.charCodeAt(0) < 128) {
        bytes.push(char.charCodeAt(0))
      } else {
        bytes.push(0x3f) // '?' for unknown characters
      }
    }
    return bytes
  }

  private buildLineCommand(char: string = '-', width: number = 48): number[] {
    return this.buildTextCommand(char.repeat(width))
  }

  private padLine(left: string, right: string, width: number): string {
    const spaces = width - left.length - right.length
    if (spaces < 1) {
      return left.substring(0, width - right.length - 1) + ' ' + right
    }
    return left + ' '.repeat(spaces) + right
  }

  private centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2))
    return ' '.repeat(padding) + text
  }

  buildReceiptCommands(data: {
    restaurantName: string
    restaurantAddress?: string
    restaurantPhone?: string
    restaurantSiret?: string
    restaurantTva?: string
    receiptNumber: string
    orderNumber: string
    date: string
    cashierName?: string
    items: Array<{
      name: string
      quantity: number
      unitPrice: number
      total: number
      options?: string[]
    }>
    subtotal: number
    taxes: Array<{ rate: number; amount: number }>
    discount?: number
    deliveryFee?: number
    total: number
    paymentMethod?: string
    amountPaid?: number
    change?: number
    thankYouMessage?: string
    footerText?: string
  }, width: '58mm' | '80mm' = '80mm'): Buffer {
    const lineWidth = CHARS_PER_LINE[width]
    const commands: number[] = []

    // Initialize
    commands.push(...this.buildInitCommands())

    // Header - Restaurant name (bold, centered, double height)
    commands.push(...this.buildTextCommand(this.centerText(data.restaurantName, lineWidth), {
      bold: true,
      doubleHeight: true,
      align: 'center',
    }))

    // Restaurant info
    if (data.restaurantAddress) {
      commands.push(...this.buildTextCommand(this.centerText(data.restaurantAddress, lineWidth), { align: 'center' }))
    }
    if (data.restaurantPhone) {
      commands.push(...this.buildTextCommand(this.centerText(`Tél: ${data.restaurantPhone}`, lineWidth), { align: 'center' }))
    }
    if (data.restaurantSiret) {
      commands.push(...this.buildTextCommand(this.centerText(`SIRET: ${data.restaurantSiret}`, lineWidth), { align: 'center' }))
    }
    if (data.restaurantTva) {
      commands.push(...this.buildTextCommand(this.centerText(`TVA: ${data.restaurantTva}`, lineWidth), { align: 'center' }))
    }

    // Separator
    commands.push(...this.buildLineCommand('=', lineWidth))

    // Receipt info
    commands.push(...this.buildTextCommand(`Ticket N°: ${data.receiptNumber}`, { bold: true }))
    commands.push(...this.buildTextCommand(`Commande: ${data.orderNumber}`))
    commands.push(...this.buildTextCommand(`Date: ${data.date}`))
    if (data.cashierName) {
      commands.push(...this.buildTextCommand(`Caissier: ${data.cashierName}`))
    }

    // Separator
    commands.push(...this.buildLineCommand('-', lineWidth))

    // Items header
    commands.push(...this.buildTextCommand(this.padLine('Article', 'Prix', lineWidth), { bold: true }))
    commands.push(...this.buildLineCommand('-', lineWidth))

    // Items
    for (const item of data.items) {
      const itemLine = `${item.quantity}x ${item.name}`
      const priceLine = this.formatCurrency(item.total)
      commands.push(...this.buildTextCommand(this.padLine(itemLine, priceLine, lineWidth)))

      // Options/modifiers
      if (item.options && item.options.length > 0) {
        for (const option of item.options) {
          commands.push(...this.buildTextCommand(`   + ${option}`))
        }
      }
    }

    // Separator
    commands.push(...this.buildLineCommand('-', lineWidth))

    // Subtotal
    commands.push(...this.buildTextCommand(this.padLine('Sous-total HT', this.formatCurrency(data.subtotal - data.taxes.reduce((s, t) => s + t.amount, 0)), lineWidth)))

    // Taxes
    for (const tax of data.taxes) {
      commands.push(...this.buildTextCommand(this.padLine(`TVA ${tax.rate}%`, this.formatCurrency(tax.amount), lineWidth)))
    }

    // Discount
    if (data.discount && data.discount > 0) {
      commands.push(...this.buildTextCommand(this.padLine('Remise', `-${this.formatCurrency(data.discount)}`, lineWidth)))
    }

    // Delivery fee
    if (data.deliveryFee && data.deliveryFee > 0) {
      commands.push(...this.buildTextCommand(this.padLine('Livraison', this.formatCurrency(data.deliveryFee), lineWidth)))
    }

    // Separator
    commands.push(...this.buildLineCommand('=', lineWidth))

    // Total (bold, double height)
    commands.push(...this.buildTextCommand(this.padLine('TOTAL TTC', this.formatCurrency(data.total), lineWidth), {
      bold: true,
      doubleHeight: true,
    }))

    // Payment info
    if (data.paymentMethod) {
      commands.push(...this.buildLineCommand('-', lineWidth))
      commands.push(...this.buildTextCommand(this.padLine('Paiement', data.paymentMethod, lineWidth)))
      if (data.amountPaid !== undefined) {
        commands.push(...this.buildTextCommand(this.padLine('Reçu', this.formatCurrency(data.amountPaid), lineWidth)))
      }
      if (data.change !== undefined && data.change > 0) {
        commands.push(...this.buildTextCommand(this.padLine('Rendu', this.formatCurrency(data.change), lineWidth)))
      }
    }

    // Footer
    commands.push(...this.buildLineCommand('-', lineWidth))

    if (data.thankYouMessage) {
      commands.push(...this.buildTextCommand(''))
      commands.push(...this.buildTextCommand(this.centerText(data.thankYouMessage, lineWidth), { align: 'center' }))
    }

    if (data.footerText) {
      commands.push(...this.buildTextCommand(''))
      commands.push(...this.buildTextCommand(this.centerText(data.footerText, lineWidth), { align: 'center' }))
    }

    // Feed and cut
    commands.push(...this.buildFeedCommand(4))
    commands.push(...this.buildCutCommand())

    return Buffer.from(commands)
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  async printToNetwork(commands: Buffer, host: string, port: number = 9100): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket()
      const timeout = setTimeout(() => {
        client.destroy()
        reject(new Error('Connexion à l\'imprimante expirée'))
      }, 10000)

      client.connect(port, host, () => {
        client.write(commands, (err) => {
          clearTimeout(timeout)
          if (err) {
            client.destroy()
            reject(err)
          } else {
            client.end()
            resolve()
          }
        })
      })

      client.on('error', (err) => {
        clearTimeout(timeout)
        reject(new Error(`Erreur de connexion à l'imprimante: ${err.message}`))
      })

      client.on('close', () => {
        clearTimeout(timeout)
      })
    })
  }

  async print(job: PrintJob): Promise<void> {
    if (job.printerConfig.type === 'network') {
      if (!job.printerConfig.host) {
        throw new Error('Adresse IP de l\'imprimante requise')
      }
      await this.printToNetwork(
        job.commands,
        job.printerConfig.host,
        job.printerConfig.port || 9100
      )
    } else {
      throw new Error('Impression USB non supportée côté serveur. Utilisez l\'impression navigateur.')
    }
  }

  getCommandsAsBase64(commands: Buffer): string {
    return commands.toString('base64')
  }
}

export const escposService = new EscPosService()
