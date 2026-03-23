import axios, { AxiosInstance } from 'axios'

interface VercelDomainResponse {
  name: string
  apexName: string
  projectId: string
  verified: boolean
  verification?: {
    type: string
    domain: string
    value: string
    reason: string
  }[]
  configuredBy?: string
  createdAt: number
  updatedAt: number
}

interface VercelDomainConfig {
  configuredBy?: string
  acceptedChallenges?: string[]
  misconfigured: boolean
}

interface AddDomainResult {
  success: boolean
  domain?: VercelDomainResponse
  verification?: {
    type: string
    domain: string
    value: string
  }[]
  error?: string
}

interface VerifyDomainResult {
  success: boolean
  verified: boolean
  misconfigured?: boolean
  error?: string
}

class VercelService {
  private client: AxiosInstance
  private projectId: string
  private teamId?: string

  constructor() {
    const token = process.env.VERCEL_TOKEN
    this.projectId = process.env.VERCEL_PROJECT_ID || ''
    this.teamId = process.env.VERCEL_TEAM_ID

    this.client = axios.create({
      baseURL: 'https://api.vercel.com',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }

  private getTeamQuery(): string {
    return this.teamId ? `?teamId=${this.teamId}` : ''
  }

  async addDomain(domain: string): Promise<AddDomainResult> {
    try {
      const response = await this.client.post<VercelDomainResponse>(
        `/v10/projects/${this.projectId}/domains${this.getTeamQuery()}`,
        { name: domain }
      )

      return {
        success: true,
        domain: response.data,
        verification: response.data.verification,
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message

      if (error.response?.status === 409) {
        return {
          success: false,
          error: 'DOMAIN_ALREADY_EXISTS',
        }
      }

      if (error.response?.status === 400) {
        return {
          success: false,
          error: errorMessage || 'INVALID_DOMAIN',
        }
      }

      console.error('Vercel addDomain error:', error.response?.data || error.message)
      return {
        success: false,
        error: errorMessage || 'VERCEL_API_ERROR',
      }
    }
  }

  async removeDomain(domain: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.delete(
        `/v9/projects/${this.projectId}/domains/${domain}${this.getTeamQuery()}`
      )

      return { success: true }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message

      if (error.response?.status === 404) {
        return { success: true }
      }

      console.error('Vercel removeDomain error:', error.response?.data || error.message)
      return {
        success: false,
        error: errorMessage || 'VERCEL_API_ERROR',
      }
    }
  }

  async verifyDomain(domain: string): Promise<VerifyDomainResult> {
    try {
      const response = await this.client.post<VercelDomainResponse>(
        `/v9/projects/${this.projectId}/domains/${domain}/verify${this.getTeamQuery()}`
      )

      return {
        success: true,
        verified: response.data.verified,
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message

      if (error.response?.status === 404) {
        return {
          success: false,
          verified: false,
          error: 'DOMAIN_NOT_FOUND',
        }
      }

      console.error('Vercel verifyDomain error:', error.response?.data || error.message)
      return {
        success: false,
        verified: false,
        error: errorMessage || 'VERCEL_API_ERROR',
      }
    }
  }

  async getDomainConfig(domain: string): Promise<{
    success: boolean
    config?: VercelDomainConfig
    error?: string
  }> {
    try {
      const response = await this.client.get<VercelDomainConfig>(
        `/v6/domains/${domain}/config${this.getTeamQuery()}`
      )

      return {
        success: true,
        config: response.data,
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message

      console.error('Vercel getDomainConfig error:', error.response?.data || error.message)
      return {
        success: false,
        error: errorMessage || 'VERCEL_API_ERROR',
      }
    }
  }

  async getDomain(domain: string): Promise<{
    success: boolean
    domain?: VercelDomainResponse
    error?: string
  }> {
    try {
      const response = await this.client.get<VercelDomainResponse>(
        `/v9/projects/${this.projectId}/domains/${domain}${this.getTeamQuery()}`
      )

      return {
        success: true,
        domain: response.data,
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'DOMAIN_NOT_FOUND',
        }
      }

      const errorMessage = error.response?.data?.error?.message || error.message
      console.error('Vercel getDomain error:', error.response?.data || error.message)
      return {
        success: false,
        error: errorMessage || 'VERCEL_API_ERROR',
      }
    }
  }

  async listDomains(): Promise<{
    success: boolean
    domains?: VercelDomainResponse[]
    error?: string
  }> {
    try {
      const response = await this.client.get<{ domains: VercelDomainResponse[] }>(
        `/v9/projects/${this.projectId}/domains${this.getTeamQuery()}`
      )

      return {
        success: true,
        domains: response.data.domains,
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message
      console.error('Vercel listDomains error:', error.response?.data || error.message)
      return {
        success: false,
        error: errorMessage || 'VERCEL_API_ERROR',
      }
    }
  }

  isConfigured(): boolean {
    return !!(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID)
  }
}

export const vercelService = new VercelService()
