import { MysqlConfig } from '@/infrastructure/mysql.js'
import { inject } from 'inversify'
import { DataEntity } from './entities/data.entity.js'
import { getDateTime } from '@/utils/date.util.js'

export class DataRepo {
  constructor(@inject(MysqlConfig) private mysqlConfig: MysqlConfig) {}

  /**
   * 查询剩余流量
   */
  async getDataLeft(uid: number) {
    return (
      await this.mysqlConfig.query<{ data_left: number }>(
        'SELECT data_left FROM user_traffic WHERE uid = ?',
        uid
      )
    )[0].data_left
  }

  /**
   * 获取指定日期的流量数据
   */
  async getDailyData(uid: number, date: string) {
    return this.mysqlConfig.query<DataEntity>(
      `SELECT date, uid, public_key, data_used, duration, platform
        FROM peer_daily_traffic
        WHERE uid = ? and date = ?`,
      uid,
      date
    )
  }

  /**
   * 获取指定月份的流量数据
   */
  async getMonthlyData(uid: number, start: string, end: string) {
    return this.mysqlConfig.query<DataEntity>(
      // 使用运算符比like更高效
      `SELECT date, uid, data_used, duration, platform
        FROM peer_daily_traffic
        WHERE uid = ? and date >= ? and date < ?`,
      uid,
      start,
      end
    )
  }

  /**
   * 获取所有流量数据
   */
  async getAllData(uid: number) {
    return this.mysqlConfig.query<DataEntity>(
      `SELECT date, uid, data_used, duration, platform
        FROM peer_daily_traffic
        WHERE uid = ?
      `,
      uid
    )
  }
}
