import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  statusCode: number
  code: string
  details?: unknown

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    const response: Record<string, unknown> = {
      success: false,
      error: err.code,
      message: err.message,
    }
    if (err.details) {
      response.details = err.details
    }
    return res.status(err.statusCode).json(response)
  }

  console.error('Unhandled error:', err)

  return res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'Une erreur est survenue' 
      : err.message,
  })
}
