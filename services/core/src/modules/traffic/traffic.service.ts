import { Job, Queue } from '@auroravpn/bullmq-inversify'
import { inject } from 'inversify'
import { WireguardConfig } from '@/infrastructure/wireguard.js'
import { TrafficRepo } from './traffic.repo.js'
import {
  getDateStr,
  getDateTime,
  getDateTimeStr,
  getStartOfDay,
  getStartOfDayStr,
  getYesterdayDateStr
} from '@/utils/date.util.js'
import { SocketConfig } from '@/infrastructure/socket.js'
import { SessionService } from '../session/session.service.js'

@Queue('wireguard')
export class TrafficService {
  constructor(
    @inject(WireguardConfig) private wgConfig: WireguardConfig,
    @inject(TrafficRepo) private trafficRepo: TrafficRepo,
    @inject(SessionService) private sessionService: SessionService,
    @inject(SocketConfig) private socketConfig: SocketConfig
  ) {}

  @Job('collect', { repeat: { every: 15 * 1000, immediately: true } })
  async collect() {
    await this.wgConfig.collect()
    this.wgConfig.userTraffic.forEach(async (user, uid) => {
      const { transferRx, transferTx } = user
      const { dataUsed, dataLeft } =
        await this.trafficRepo.getUserTrafficCache(uid)
      // 流量不足
      if (dataLeft < transferRx + transferTx) {
        // 关闭所有会话
        user.sessions.forEach(async (sid) => {
          this.sessionService.disconnect(sid)
        })
        // 断开websocket连接
        this.socketConfig.sockets
          .get(uid)
          ?.socketIds.forEach(async (socketId) => {
            this.socketConfig.ioApp?.to(socketId).emit('data-exhausted')
          })
        // 重置用户流量数据
        this.trafficRepo.resetUserTraffic(
          uid,
          dataUsed + transferRx + transferTx
        )
      }
    })
    this.wgConfig.sessionTraffic.forEach((session, sid) => {
      const { transferRx, transferTx } = session
      // 更新节点流量数据缓存
      this.trafficRepo.setSessionTrafficCache(sid, {
        transferRx,
        transferTx
      })
    })
  }

  @Job('update', { repeat: { every: 1 * 60 * 1000 } })
  async update() {
    this.wgConfig.sessionTraffic.forEach(async (session, sid) => {
      const { transferRx, transferTx, uid, peerPublicKey } = session

      // 更新用户剩余流量数据
      const { dataUsed: userDataUsed, dataLeft } =
        await this.trafficRepo.getUserTrafficCache(uid)
      await this.trafficRepo.updateUserTraffic(
        uid,
        userDataUsed + transferRx + transferTx,
        dataLeft - transferRx - transferTx
      )
      // 更新会话数据
      this.trafficRepo.updateSessionTraffic(
        sid,
        getDateTimeStr(),
        transferRx,
        transferTx
      )
      // 获取节点流量数据缓存
      const { dataUsed, duration } =
        await this.trafficRepo.getPeerTrafficCache(peerPublicKey)
      // 更新Mysql节点流量数据
      const startTime = await this.trafficRepo.getSessionStartTime(sid)
      const { affectedRows } = await this.trafficRepo.updatePeerTraffic(
        peerPublicKey,
        getDateStr(),
        transferRx + transferTx + dataUsed,
        getDateTime() - getDateTime(startTime) + duration
      )
      // 找不到当日流量数据, 进行日切处理
      if (affectedRows === 0) {
        // 重新计算流量计算起点
        const newDataUsed =
          dataUsed -
          (await this.trafficRepo.selectPeerDataUsed(
            peerPublicKey,
            getYesterdayDateStr()
          ))

        // 重新设置流量计算开始时间
        this.trafficRepo.setPeerTrafficCache(
          peerPublicKey,
          newDataUsed,
          getStartOfDayStr()
        )

        // 插入节点流量数据
        this.trafficRepo.insertPeerTraffic(
          getDateStr(),
          peerPublicKey,
          session.uid,
          transferRx + transferTx + newDataUsed,
          getDateTime() - getStartOfDay()
        )
      }
    })
  }

  @Job('cleanup', { repeat: { every: 5 * 60 * 1000, immediately: true } })
  async cleanup() {
    // 获取所有缓存数据的键
    const { uids, sids, peerPublicKeys } = await this.trafficRepo.getAllKeys()

    // 遍历会话公钥
    sids.forEach(async (sid) => {
      if (!this.wgConfig.sessionTraffic.has(sid)) {
        this.trafficRepo.delSessionCache(sid)
        // 将会话状态设为inactive
        this.trafficRepo.inactiveSession(sid)
      }
    })

    // 遍历节点公钥
    peerPublicKeys.forEach((publicKey) => {
      const target = Array.from(this.wgConfig.sessionTraffic.values()).find(
        (peer) => peer.peerPublicKey === publicKey
      )
      if (!target) {
        this.trafficRepo.delPeerCache(publicKey)
      }
    })

    // 遍历用户ID
    uids.forEach((uid) => {
      if (!this.wgConfig.userTraffic.has(uid)) {
        this.trafficRepo.delUserCache(uid)
      }
    })
  }
}
