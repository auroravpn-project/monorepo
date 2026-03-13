import { BaseClient } from './base.js'

import { ConnectionError } from './errors/connection.error.js'
import { QueryError } from './errors/query.error.js'

import { RedisOptions, Redis } from 'ioredis'

export type RedisConfig = RedisOptions

export class RedisClient extends BaseClient {
  private client: Redis
  constructor(config: RedisConfig) {
    super()
    try {
      this.client = new Redis(config)
    } catch (error) {
      throw new ConnectionError('Database connection failed')
    }
  }

  /* 标准方法 */
  async disconnect() {
    try {
      this.client.quit()
    } catch (error) {
      throw new ConnectionError('Database disconnection failed')
    }
  }
  async query<T = any>(command: string, ...args: any[]): Promise<T[]> {
    try {
      const result = (await this.client?.call(command, ...args)) as T[]
      return result
    } catch (error: any) {
      throw new QueryError(error.message)
    }
  }
  async execute<T = any>(command: string, ...args: any[]): Promise<T> {
    try {
      const result = (await this.client?.call(command, ...args)) as T
      return result
    } catch (error: any) {
      throw new QueryError(error.message)
    }
  }

  getClient() {
    return this.client
  }

  /* Redis 特定方法 */
  async get(key: string): Promise<string | null> {
    return this.get(key)
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field)
  }

  async hgetall<T = object>(key: string): Promise<T> {
    return this.client.hgetall(key) as T
  }

  async set(key: string, value: string): Promise<void> {
    this.client.set(key, value)
  }

  async hset(key: string, field: string, val: string | number) {
    this.client.hset(key, field, val)
  }

  async hmset(key: string, val: object) {
    this.client.hset(key, val)
  }

  async del(key: string): Promise<void> {
    this.client.del(key)
  }

  async keys(pattern: string) {
    return this.client.keys(pattern)
  }
}
