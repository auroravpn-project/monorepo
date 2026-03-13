import { MysqlClient } from '@packages/db'
import { inject, injectable } from 'inversify'
import { ConfigService } from '../config/index.js'

// 封装成类方便依赖注入
@injectable()
export class MysqlConfig extends MysqlClient {
  constructor(@inject(ConfigService) configService: ConfigService) {
    const {
      database: {
        mysql: { host, port, user, password, database }
      }
    } = configService.getConfigs()

    super({
      host,
      port,
      user,
      password,
      database
    })
  }
}
