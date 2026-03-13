import { injectable } from 'inversify'
import { ConfigSchema, ConfigType } from './schema.js'
import { ServiceDiscovery } from '@packages/sd'

@injectable()
export class ConfigService {
  private configs: ConfigType | null = null

  public async pullConsulConfig() {
    const configs =
      await ServiceDiscovery.getYamlConfig<ConfigType>('user_config')
    try {
      ConfigSchema.parse(configs)
      this.configs = configs
    } catch (err: any) {
      throw new Error(`配置不合法: ${err.message}`)
    }
  }

  public getConfigs() {
    if (!this.configs) {
      console.error(new Error('请先初始化配置'))
      process.exit(1)
    }
    return { ...this.configs }
  }
}
