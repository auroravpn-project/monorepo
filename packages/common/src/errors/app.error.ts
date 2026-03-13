import { ErrorCodes } from './index.js'

export class AppError extends Error {
  constructor(
    message: string,
    name = 'AppError',
    public code: (typeof ErrorCodes)[keyof typeof ErrorCodes],
    public status = 500
  ) {
    super(message)
    this.name = name
  }
}
