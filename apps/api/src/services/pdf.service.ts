import puppeteer, { Browser, Page } from 'puppeteer-core'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'

interface PdfOptions {
  format?: 'A4' | 'A5' | 'Letter' | 'Legal'
  width?: string
  height?: string
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  landscape?: boolean
  printBackground?: boolean
}

// Chemins possibles pour Chrome/Chromium selon l'OS
const getChromePaths = (): string[] => {
  const platform = os.platform() as 'win32' | 'darwin' | 'linux'
  
  // Priorité à la variable d'environnement CHROME_PATH
  const envPath = process.env.CHROME_PATH
  const paths: string[] = envPath ? [envPath] : []
  
  if (platform === 'win32') {
    paths.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`,
    )
  } else if (platform === 'darwin') {
    paths.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    )
  } else {
    paths.push(
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
      '/usr/bin/microsoft-edge',
    )
  }
  
  return paths.filter(Boolean) as string[]
}

class PdfService {
  private browser: Browser | null = null
  private chromePath: string | null = null
  private initialized: boolean = false
  private initPromise: Promise<void> | null = null

  constructor() {
    this.initPromise = this.findChromePath()
  }

  private async findChromePath(): Promise<void> {
    const paths = getChromePaths()

    for (const chromePath of paths) {
      try {
        await fs.access(chromePath)
        this.chromePath = chromePath
        console.log(`Chrome found at: ${chromePath}`)
        this.initialized = true
        return
      } catch {
        // Path doesn't exist, try next
      }
    }

    this.initialized = true
    console.warn('Chrome/Chromium not found. PDF generation will not work. Set CHROME_PATH environment variable.')
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized && this.initPromise) {
      await this.initPromise
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser
    }

    if (!this.chromePath) {
      throw new Error('Chrome/Chromium non trouvé. Veuillez installer Chrome ou définir CHROME_PATH.')
    }

    this.browser = await puppeteer.launch({
      executablePath: this.chromePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--font-render-hinting=none',
      ],
    })

    return this.browser
  }

  /**
   * Génère un PDF à partir de HTML
   */
  async generatePdfFromHtml(html: string, options: PdfOptions = {}): Promise<Buffer> {
    const browser = await this.getBrowser()
    let page: Page | null = null

    try {
      page = await browser.newPage()

      // Définir le contenu HTML
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      // Attendre que les polices soient chargées
      await page.evaluateHandle('document.fonts.ready')

      // Générer le PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        ...(options.width && { width: options.width }),
        ...(options.height && { height: options.height }),
        margin: options.margin || {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
        landscape: options.landscape || false,
        printBackground: options.printBackground !== false,
        preferCSSPageSize: true,
      })

      return Buffer.from(pdfBuffer)
    } finally {
      if (page) {
        await page.close()
      }
    }
  }

  /**
   * Génère un PDF pour un ticket de caisse (format thermique)
   */
  async generateReceiptPdf(html: string, width = '80mm'): Promise<Buffer> {
    const browser = await this.getBrowser()
    let page: Page | null = null

    try {
      page = await browser.newPage()

      // Définir la taille de la page pour un ticket
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      // Attendre que les polices soient chargées
      await page.evaluateHandle('document.fonts.ready')

      // Calculer la hauteur du contenu
      const bodyHandle = await page.$('body')
      const boundingBox = await bodyHandle?.boundingBox()
      const contentHeight = boundingBox ? Math.ceil(boundingBox.height) + 20 : 500

      // Générer le PDF avec la taille du ticket
      const pdfBuffer = await page.pdf({
        width: width,
        height: `${contentHeight}px`,
        margin: {
          top: '5mm',
          right: '3mm',
          bottom: '5mm',
          left: '3mm',
        },
        printBackground: true,
        preferCSSPageSize: false,
      })

      return Buffer.from(pdfBuffer)
    } finally {
      if (page) {
        await page.close()
      }
    }
  }

  /**
   * Génère un PDF pour une facture A4
   */
  async generateInvoicePdf(html: string): Promise<Buffer> {
    return this.generatePdfFromHtml(html, {
      format: 'A4',
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
      printBackground: true,
    })
  }

  /**
   * Ferme le navigateur
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Vérifie si le service est disponible (async)
   */
  async isAvailableAsync(): Promise<boolean> {
    await this.ensureInitialized()
    return this.chromePath !== null
  }

  /**
   * Vérifie si le service est disponible (sync - peut retourner false si pas encore initialisé)
   */
  isAvailable(): boolean {
    return this.initialized && this.chromePath !== null
  }
}

export const pdfService = new PdfService()
