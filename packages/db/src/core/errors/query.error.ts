export class QueryError extends Error {
  name = 'QueryError'
  code = 'QUERY_ERROR'
  constructor(message: string) {
    super(message)
  }
}
