import Consul from 'consul'
import yaml from 'yaml'
import { ConfigNotFoundError } from './errors/config-not-found.error.js'
import { ConfigFormatError } from './errors/config-format.error.js'

export class ServiceDiscovery {
  private static consul = new Consul({
    host: process.env.CONSUL_HTTP_ADDR || 'localhost',
    port: 8500
  })

  public static async registerServer(
    name: string,
    address: string,
    port: number
  ) {
    return this.consul.agent.service.register({
      name,
      address,
      port,
      check: {
        name,
        http: `http://${address}:${port}/health`,
        interval: '10s',
        timeout: '5s'
      }
    })
  }

  public static async getServer(name: string) {
    return this.consul.health.service({
      service: name,
      passing: true
    })
  }

  public static async getYamlConfig<T>(key: string) {
    const result = await this.consul.kv.get({ key })
    if (!result?.Value) {
      throw new ConfigNotFoundError(`Configuration does not exist: ${key}`)
    }
    // 解析yaml配置
    try {
      return yaml.parse(result.Value) as T
    } catch (err: any) {
      throw new ConfigFormatError(`Invalid configuration format: ${key}`)
    }
  }
}
