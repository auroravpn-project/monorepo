import { inject, injectable } from 'inversify'
import { RedisClient } from '@packages/db'
import { ConfigService } from '@/config/index.js'

// 封装成类方便依赖注入
@injectable()
export class RedisConfig extends RedisClient {
  constructor(@inject(ConfigService) configService: ConfigService) {
    const { host, port } = configService.getConfigs().database.redis
    super({ host, port, db: 1 })
  }
}
