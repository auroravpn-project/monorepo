export class ConfigNotFoundError extends Error {
  name = 'ConfigNotFoundError'
  code = 'CONFIG_NOT_FOUND_ERROR'
  constructor(message: string) {
    super(message)
  }
}
