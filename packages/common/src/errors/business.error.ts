import { ErrorCodes } from './index.js'
import { AppError } from './app.error.js'

export class BusinessError extends AppError {
  constructor(message: string = 'Confict') {
    super(message, 'BusinessError', ErrorCodes.BUSINESS_ERROR, 409)
  }
}
