export class ConnectionError extends Error {
  name = 'ConnectionError'
  code = 'CONNECTION_ERROR'
  constructor(message: string) {
    super(message)
  }
}
