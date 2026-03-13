import { BaseClient } from './base.js'
import { ConnectionError } from './errors/connection.error.js'
import { QueryError } from './errors/query.error.js'

import mysql, { PoolOptions, Pool } from 'mysql2/promise'

export type MysqlConfig = PoolOptions

export class MysqlClient extends BaseClient {
  private pool: Pool
  constructor(config: MysqlConfig) {
    super()
    try {
      this.pool = mysql.createPool({
        user: config.user,
        password: config.password,
        database: config.database,
        host: config.host || 'localhost',
        port: config.port || 3306
      })
    } catch (error) {
      throw new ConnectionError('Database connect faild')
    }
  }
  async disconnect() {
    try {
      this.pool.end()
    } catch (error) {
      throw new ConnectionError('Database disconnect faild')
    }
  }
  async query<T = any>(command: string, ...args: any[]): Promise<T[]> {
    try {
      return ((await this.pool.query(command, args)) as any)[0] as T[]
    } catch (error: any) {
      throw new QueryError(error.message)
    }
  }
  async execute<T = any>(command: string, ...args: any[]): Promise<T> {
    try {
      return ((await this.pool.execute(command, args)) as any)[0] as T
    } catch (error: any) {
      throw new QueryError(error.message)
    }
  }
}
