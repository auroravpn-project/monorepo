import { ServiceDiscovery } from '@packages/sd'
import { ConfigSchema, ConfigType } from './schema.js'
import { injectable } from 'inversify'

@injectable()
export class ConfigService {
  private configs: ConfigType | null = null

  public async pullConsulConfig() {
    const configs =
      await ServiceDiscovery.getYamlConfig<ConfigType>('core_config')
    try {
      ConfigSchema.parse(configs)
      this.configs = configs
    } catch (err: any) {
      console.log(err)

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
