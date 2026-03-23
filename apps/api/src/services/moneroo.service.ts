import crypto from 'crypto'

const MONEROO_API_URL = 'https://api.moneroo.io/v1'

export type PaymentLevel = 'platform' | 'reseller' | 'restaurant'

export interface MonerooConfig {
  publicKey: string
  secretKey: string
  webhookSecret?: string
}

export interface MonerooCustomer {
  email: string
  first_name: string
  last_name: string
  phone?: string
}

export interface MonerooPaymentInit {
  amount: number
  currency: string
  description: string
  return_url: string
  customer: MonerooCustomer
  metadata?: Record<string, string>
  methods?: string[]
}

export interface MonerooPaymentResponse {
  message: string
  data: {
    id: string
    checkout_url: string
  }
}

export interface MonerooVerifyResponse {
  message: string
  data: {
    id: string
    status: 'success' | 'pending' | 'failed'
    is_processed: boolean
    processed_at: string | null
    amount: number
    currency: {
      code: string
      name: string
    }
    amount_formatted: string
    description: string
    return_url: string
    environment: 'sandbox' | 'live'
    initiated_at: string
    checkout_url: string
    customer: {
      email: string
      first_name: string
      last_name: string
    }
    metadata: Record<string, string>
  }
}

export interface MonerooWebhookPayload {
  event: 'payment.initiated' | 'payment.success' | 'payment.failed' | 'payment.cancelled'
  data: {
    id: string
    status: string
    amount: number
    currency: string
    metadata?: Record<string, string>
  }
}

class MonerooService {
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    secretKey: string,
    body?: object
  ): Promise<T> {
    const response = await fetch(`${MONEROO_API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { message?: string }
      throw new Error(error.message || `Moneroo API error: ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  async initializePayment(
    config: MonerooConfig,
    payment: MonerooPaymentInit
  ): Promise<MonerooPaymentResponse> {
    return this.request<MonerooPaymentResponse>(
      '/payments/initialize',
      'POST',
      config.secretKey,
      payment
    )
  }

  async verifyPayment(
    config: MonerooConfig,
    paymentId: string
  ): Promise<MonerooVerifyResponse> {
    return this.request<MonerooVerifyResponse>(
      `/payments/${paymentId}/verify`,
      'GET',
      config.secretKey
    )
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }

  generateReturnUrl(
    baseUrl: string,
    level: PaymentLevel,
    entityId: string,
    paymentType: string
  ): string {
    return `${baseUrl}/api/payments/${level}/${entityId}/callback?type=${paymentType}`
  }

  generateWebhookUrl(
    baseUrl: string,
    level: PaymentLevel,
    entityId?: string
  ): string {
    if (level === 'platform') {
      return `${baseUrl}/api/webhooks/moneroo/platform`
    }
    return `${baseUrl}/api/webhooks/moneroo/${level}/${entityId}`
  }

  generateShowcaseReturnUrl(
    baseUrl: string,
    organizationSlug: string,
    onboardingToken: string
  ): string {
    return `${baseUrl}/showcase/${organizationSlug}/onboarding?token=${onboardingToken}`
  }

  generateShowcaseWebhookUrl(baseUrl: string): string {
    return `${baseUrl}/api/webhooks/moneroo/showcase`
  }
}

export const monerooService = new MonerooService()
