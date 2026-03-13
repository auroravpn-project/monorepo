export class ConfigFormatError extends Error {
  name = 'ConfigFormatError'
  code = 'CONFIG_FORMAT_ERROR'
  constructor(message: string) {
    super(message)
  }
}
