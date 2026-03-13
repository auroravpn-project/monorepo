import { MysqlConfig } from '@/infrastructure/mysql.js'
import { inject, injectable } from 'inversify'
import { RedisConfig } from '@/infrastructure/redis.js'
import { getDateStr, getDateTimeStr } from '@/utils/date.util.js'
import { genPeerKey, genSessionKey, genUserKey } from '@/utils/redis.util.js'

@injectable()
export class SessionRepo {
  constructor(
    @inject(MysqlConfig) private mysqlConfig: MysqlConfig,
    @inject(RedisConfig) private redisConfig: RedisConfig
  ) {}

  /**
   * 插入用户流量数据
   */
  async insertUser(uid: number) {
    this.mysqlConfig.query('INSERT INTO user_traffic (uid) VALUES (?)', uid)
  }

  /**
   * 查询用户流量
   */
  async selectUser(uid: number) {
    return (
      await this.mysqlConfig.query<{
        data_left: number
        data_used: number
      }>('SELECT data_left,data_used FROM user_traffic WHERE uid = ?', uid)
    )[0]
  }

  /**
   * 创建用户流量缓存
   */
  async setUserCache(uid: number, dataUsed: number, dataLeft: number) {
    this.redisConfig.hmset(genUserKey(uid), {
      dataLeft,
      dataUsed
    })
  }

  /**
   * 获取用户流量数据缓存
   */
  async getDataLeftCache(uid: number) {
    const { dataLeft } = await this.redisConfig.hgetall<{ dataLeft: number }>(
      genUserKey(uid)
    )
    return dataLeft
  }

  /**
   * 清除用户缓存
   */
  async delUserCache(uid: number) {
    this.redisConfig.del(genUserKey(uid))
  }

  /**
   * 插入会话数据
   */
  async insertSession(uid: number, publicKey: string) {
    const { insertId: sid } = await this.mysqlConfig.execute<{
      insertId: number
    }>('INSERT INTO sessions (uid,public_key) VALUES (?,?)', uid, publicKey)
    return sid
  }

  /**
   * 将会话状态设置为inactive
   */
  async inactiveSession(sid: number, transferRx: number, transferTx: number) {
    this.mysqlConfig.execute(
      `UPDATE sessions
        SET end_time = ?, status = ?, transfer_rx = ?, transfer_tx = ?
        WHERE sid=?`,
      getDateTimeStr(),
      'inactive',
      transferRx,
      transferTx,
      sid
    )
  }

  /**
   * 创建会话缓存
   */
  async setSessionCache(uid: number, sid: number) {
    this.redisConfig.hmset(genSessionKey(sid), {
      transferTx: 0,
      transferRx: 0,
      uid,
      sid,
      startTime: getDateTimeStr()
    })
  }

  /**
   * 删除会话缓存
   */
  async delSessionCache(sid: number) {
    this.redisConfig.del(genSessionKey(sid))
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
   * 插入节点数据
   */
  async insertPeer(publicKey: string, uid: number) {
    this.mysqlConfig.execute(
      'INSERT INTO peer_daily_traffic (public_key,uid) VALUES (?,?)',
      publicKey,
      uid
    )
  }

  /**
   * 更新节点数据
   */
  async updatePeer(publicKey: string, dataUsed: number, duration: number) {
    this.mysqlConfig.execute(
      `UPDATE peer_daily_traffic SET 
        data_used = ?, duration = ?
        WHERE public_key = ? AND date = ?`,
      dataUsed,
      duration,
      publicKey,
      getDateStr()
    )
  }

  /**
   * 查询节点数据
   */
  async selectPeer(publicKey: string, date: string) {
    return (
      await this.mysqlConfig.query<{ data_used: number; duration: number }>(
        'SELECT data_used,duration FROM peer_daily_traffic WHERE public_key = ? and date = ?',
        publicKey,
        date
      )
    )[0]
  }

  /**
   * 创建节点数据缓存
   */
  async setPeerCache(
    publicKey: string,
    uid: number,
    dataUsed: number,
    duration: number
  ) {
    this.redisConfig.hmset(genPeerKey(publicKey), {
      dataUsed,
      duration,
      uid
    })
  }

  /**
   * 删除节点缓存
   */
  async delPeerCache(publicKey: string) {
    this.redisConfig.del(genPeerKey(publicKey))
  }

  /**
   * 获取节点流量数据缓存
   */
  async getPeerCache(publicKey: string) {
    const { dataUsed, duration } = await this.redisConfig.hgetall<{
      dataUsed: string
      duration: string
    }>(genPeerKey(publicKey))
    return {
      dataUsed: Number(dataUsed),
      duration: Number(duration)
    }
  }
}
