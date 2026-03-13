import { MysqlConfig } from '@/infrastructure/mysql.js'
import { RedisConfig } from '@/infrastructure/redis.js'
import {
  genPeerKey,
  genSessionKey,
  genUserKey,
  getPublicKey,
  getSID,
  getUID
} from '@/utils/redis.util.js'
import { inject, injectable } from 'inversify'

@injectable()
export class TrafficRepo {
  constructor(
    @inject(MysqlConfig) private mysqlConfig: MysqlConfig,
    @inject(RedisConfig) private redisConfig: RedisConfig
  ) {}

  /**
   * 获取用户流量数据缓存
   */
  async getUserTrafficCache(uid: number) {
    const { dataLeft, dataUsed } = await this.redisConfig.hgetall<{
      dataUsed: string
      dataLeft: string
    }>(genUserKey(uid))
    return {
      dataLeft: Number(dataLeft),
      dataUsed: Number(dataUsed)
    }
  }

  /**
   * 删除用户缓存
   */
  async delUserCache(uid: number) {
    return this.redisConfig.del(genUserKey(uid))
  }

  /**
   * 重置用户流量数据
   */
  async resetUserTraffic(uid: number, finnalDataUsed: number) {
    this.mysqlConfig.query(
      'UPDATE user_traffic SET data_left = 0,data_used = ? WHERE uid = ?',
      finnalDataUsed,
      uid
    )
    this.redisConfig.del(genUserKey(uid))
  }

  /**
   * 更新用户流量数据
   */
  async updateUserTraffic(uid: number, dataUsed: number, dataLeft: number) {
    this.mysqlConfig.execute(
      `UPDATE user_traffic
        SET data_used = ?, data_left = ?
        WHERE uid = ?`,
      dataUsed,
      dataLeft,
      uid
    )
  }

  /**
   * 更新会话流量数据缓存
   */
  async setSessionTrafficCache(
    sid: number,
    traffic: { transferRx: number; transferTx: number }
  ) {
    this.redisConfig.hset(genSessionKey(sid), 'transferRx', traffic.transferRx)
    this.redisConfig.hset(genSessionKey(sid), 'transferTx', traffic.transferTx)
  }

  /**
   * 获取会话开始时间
   */
  async getSessionStartTime(sid: number) {
    const { startTime } = await this.redisConfig.hgetall<{ startTime: string }>(
      genSessionKey(sid)
    )
    return startTime
  }

  /**
   * 更新节点数据
   */
  async updatePeerTraffic(
    publicKey: string,
    date: string,
    dataUsed: number,
    duration: number
  ) {
    return this.mysqlConfig.execute<{ affectedRows: number }>(
      `UPDATE peer_daily_traffic
        SET data_used = ?, duration = ?
        WHERE date=? AND public_key=?`,
      dataUsed,
      duration,
      date,
      publicKey
    )
  }

  /**
   * 查询节点使用流量
   */
  async selectPeerDataUsed(publicKey: string, date: string) {
    return (
      await this.mysqlConfig.query<{ data_used: number }>(
        'SELECT data_used FROM peer_daily_traffic WHERE public_key = ? and date = ?',
        publicKey,
        date
      )
    )[0].data_used
  }

  /**
   * 获得节点使用流量缓存
   */
  async getPeerTrafficCache(publicKey: string) {
    const { dataUsed, duration } = await this.redisConfig.hgetall<{
      dataUsed: string
      duration: string
    }>(genPeerKey(publicKey))
    return {
      dataUsed: Number(dataUsed),
      duration: Number(duration)
    }
  }

  /**
   * 设置节点流量数据缓存
   */
  async setPeerTrafficCache(
    publicKey: string,
    dataUsed: number,
    startTime: string
  ) {
    this.redisConfig.hset(genPeerKey(publicKey), 'dataUsed', dataUsed)
    this.redisConfig.hset(genPeerKey(publicKey), 'startTime', startTime)
  }

  /**
   * 删除节点缓存
   */
  async delPeerCache(publicKey: string) {
    return this.redisConfig.del(genPeerKey(publicKey))
  }

  /**
   * 插入节点流量数据
   */
  async insertPeerTraffic(
    date: string,
    publicKey: string,
    uid: number,
    dataUsed: number,
    duration: number
  ) {
    this.mysqlConfig.execute(
      'INSERT INTO peer_daily_traffic (date,public_key,uid,data_used,duration) VALUES(?,?,?,?,?)',
      date,
      publicKey,
      uid,
      dataUsed,
      duration
    )
  }

  /**
   * 更新会话数据
   */
  async updateSessionTraffic(
    sid: number,
    endTime: string,
    transferRx: number,
    transferTx: number
  ) {
    return this.mysqlConfig.execute(
      `UPDATE sessions
        SET end_time = ?, transfer_rx = ?,transfer_tx = ?
        WHERE sid=?`,
      endTime,
      transferRx,
      transferTx,
      sid
    )
  }

  /**
   * 将会话状态设为关闭
   */
  async inactiveSession(sid: number) {
    this.mysqlConfig.execute(
      'UPDATE sessions SET status = ? WHERE sid = ?',
      'inactive',
      sid
    )
  }

  /**
   * 删除会话缓存
   */
  async delSessionCache(sid: number) {
    return this.redisConfig.del(genSessionKey(sid))
  }

  /**
   * 获取所有缓存数据的键
   */
  async getAllKeys() {
    const sessionKeys: string[] = await this.redisConfig.keys(genSessionKey())
    const peerKeys: string[] = await this.redisConfig.keys(genPeerKey())
    const userKeys: string[] = await this.redisConfig.keys(genUserKey())

    return {
      sids: sessionKeys.map((item) => getSID(item)),
      peerPublicKeys: peerKeys.map((item) => getPublicKey(item)),
      uids: userKeys.map((item) => getUID(item))
    }
  }
}
