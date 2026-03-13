import { ErrorCodes } from './index.js'
import { AppError } from './app.error.js'

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UnauthorizedError', ErrorCodes.UNAUTHORIZED_ERROR, 401)
  }
}
