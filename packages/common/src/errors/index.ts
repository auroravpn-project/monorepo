import { AppError } from './app.error.js'
import { UnauthorizedError } from './unauthorized.error.js'
import { BusinessError } from './business.error.js'

export { AppError, UnauthorizedError, BusinessError }

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_FAILED',
  UNAUTHORIZED_ERROR: 'UNAUTHORIZED_ERROR',
  BUSINESS_ERROR: 'BUSINESS_ERROR'
} as const
