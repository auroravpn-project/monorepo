import { inject, injectable } from 'inversify'

import exporter from '@auroravpn/wireguard-exporter-sdk'
import { generate } from '@/utils/ipv4.util.js'
import { ConfigService } from '@/config/index.js'

export interface SessionTraffic {
  uid: number
  peerPublicKey: string
  interfaceName: string
  allowedIps: string
  transferRx: number
  transferTx: number
}

export interface UserTraffic {
  transferRx: number
  transferTx: number
  sessions: number[]
}

@injectable()
export class WireguardConfig {
  constructor(@inject(ConfigService) configService: ConfigService) {
    const { host, port } = configService.getConfigs().exporter
    this.exporter = exporter({ host, port })
    this.init()
  }
  public exporter
  public userTraffic = new Map<number, UserTraffic>()
  public sessionTraffic = new Map<number, SessionTraffic>()
  private readonly pool = generate('10.0.0.0/24').filter(
    (ip) => ip !== '10.0.0.1'
  )

  private endpoint: string | null = null
  private publicKey: string | null = null

  private async init() {
    const { publicKey, endpoint } = (await this.exporter.showAllDump())[0]
    this.publicKey = publicKey
    this.endpoint = endpoint
  }

  /**
   * 采集流量数据
   */
  async collect() {
    // 操作原始数据
    const res = await this.exporter.showAllDump()

    const originDumps = res.flatMap((ifa) =>
      ifa.peers.map((peer) => ({
        ...peer,
        interfaceName: ifa.interfaceName
      }))
    )

    // 清空用户数据, 方便后续累加
    this.userTraffic.forEach((user) => {
      user.transferRx = 0
      user.transferTx = 0
    })

    // 遍历原始数据, 如果在本地找不到peerPublicKey一样的元素, 说明非法入侵
    originDumps.forEach((peer) => {
      const target = Array.from(this.sessionTraffic.values()).find(
        (session) => session.peerPublicKey === peer.peerPublicKey
      )
      if (!target) {
        // todo: 向管理员抛出非法入侵提示
        console.log('非法入侵')

        return this.exporter.removePeer({
          interfaceName: peer.interfaceName,
          peerPublicKey: peer.peerPublicKey
        })
      }
      // 更新会话数据
      target.transferRx = peer.transferRx
      target.transferTx = peer.transferTx

      // 更新用户数据
      const user = this.userTraffic.get(target.uid) as UserTraffic
      user.transferRx += peer.transferRx
      user.transferTx += peer.transferTx
    })
  }

  async remove(sid: number) {
    const session = this.sessionTraffic.get(sid)
    if (session) {
      // WireGuard基础设施退出连接
      this.exporter.removePeer({
        interfaceName: session.interfaceName,
        peerPublicKey: session.peerPublicKey
      })
      // 删除节点
      this.sessionTraffic.delete(sid)
      // 删除用户中的公钥
      const user = this.userTraffic.get(session.uid) as UserTraffic
      user.sessions = user.sessions.filter((userSID) => userSID !== sid)
      // 如果公钥全部被删除, 说明该用户没有任何会话, 删除
      if (user.sessions.length === 0) {
        this.userTraffic.delete(session.uid)
      }
    }
  }

  assignIpAddress() {
    // 分配IP地址
    const usedIps = new Set(
      Array.from(this.sessionTraffic.values()).map((peer) => peer.allowedIps)
    )
    const allowedIps = this.pool.find((ip) => !usedIps.has(ip))
    if (!allowedIps) {
      throw new Error('连接池已满')
    }
    return allowedIps
  }

  async add(uid: number, sid: number, peerPublicKey: string) {
    // 如果没有初始化先初始化
    if (!this.publicKey || !this.endpoint) {
      await this.init()
    }
    // 添加用户
    if (!this.userTraffic.has(uid)) {
      this.userTraffic.set(uid, {
        transferRx: 0,
        transferTx: 0,
        sessions: [sid]
      })
    }

    const allowedIps = this.assignIpAddress()

    // 新建会话
    this.sessionTraffic.set(sid, {
      uid,
      peerPublicKey,
      interfaceName: 'wg0',
      allowedIps,
      transferRx: 0,
      transferTx: 0
    })

    // WireGuard基础设施连接
    this.exporter.setPeer({
      interfaceName: 'wg0',
      peerPublicKey,
      allowedIps
    })
    return {
      peerEndpoint: this.endpoint,
      peerPublicKey: this.publicKey,
      interfaceAddress: allowedIps
    }
  }
}
