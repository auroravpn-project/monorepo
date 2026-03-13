import { SessionTraffic, WireguardConfig } from '@/infrastructure/wireguard.js'
import { inject, injectable } from 'inversify'
import { SessionRepo } from './session.repo.js'
import { getDateStr, getDateTime } from '@/utils/date.util.js'

@injectable()
export class SessionService {
  constructor(
    @inject(WireguardConfig) private wgConfig: WireguardConfig,
    @inject(SessionRepo) private sessionRepo: SessionRepo
  ) {}

  /**
   * 启动连接
   */
  async connect(uid: number, peerPublicKey: string) {
    const out = await this.sessionRepo.selectUser(uid)
    if (out?.data_left <= 3 * 1000 * 1000) {
      throw new Error('流量不足')
    }
    // 创建用户缓存
    this.sessionRepo.setUserCache(uid, out.data_used, out.data_left)
    // 创建会话
    const sid = await this.sessionRepo.insertSession(uid, peerPublicKey)
    this.sessionRepo.setSessionCache(uid, sid)
    // 连接WireGuard基础设施
    const configs = await this.wgConfig.add(uid, sid, peerPublicKey)
    // 查询当日节点数据
    const res = await this.sessionRepo.selectPeer(peerPublicKey, getDateStr())
    if (res) {
      // 新建节点缓存
      this.sessionRepo.setPeerCache(
        peerPublicKey,
        uid,
        res.data_used,
        res.duration
      )
    } else {
      // 如果当日节点数据不存在, 插入节点数据
      this.sessionRepo.insertPeer(peerPublicKey, uid)
      // 新建节点缓存
      this.sessionRepo.setPeerCache(peerPublicKey, uid, 0, 0)
    }
    return {
      sid,
      configs
    }
  }

  /**
   * 关闭连接
   */
  async disconnect(sid: number) {
    const target = this.wgConfig.sessionTraffic.get(sid)
    if (target) {
      const { uid, peerPublicKey, transferRx, transferTx } = target
      // WireGuard基础设施断开连接
      this.wgConfig.remove(sid)
      // 如果userTraffic数据已经被全部删除, 清除Redis缓存
      if (!this.wgConfig.userTraffic.get(uid)) {
        this.sessionRepo.delUserCache(uid)
      }
      // 更新会话数据
      this.sessionRepo.inactiveSession(sid, transferRx, transferTx)
      // 更新节点数据
      const startTime = await this.sessionRepo.getSessionStartTime(sid)
      const { dataUsed, duration } =
        await this.sessionRepo.getPeerCache(peerPublicKey)
      this.sessionRepo.updatePeer(
        target.peerPublicKey,
        dataUsed + transferRx + transferTx,
        duration + getDateTime() - getDateTime(startTime)
      )
      // 删除会话缓存
      this.sessionRepo.delSessionCache(sid)
      // 删除节点缓存
      this.sessionRepo.delPeerCache(peerPublicKey)
    }
  }

  /**
   * 获取流量数据
   */
  async getDataLeft(uid: number) {
    const user = this.wgConfig.userTraffic.get(uid)
    if (user) {
      const dataLeft = await this.sessionRepo.getDataLeftCache(uid)
      return dataLeft - user.transferRx - user.transferTx
    }
  }
}
