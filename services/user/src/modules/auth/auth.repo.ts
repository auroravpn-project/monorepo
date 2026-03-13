import { inject, injectable } from 'inversify'
import { LoginDTO } from './dto/login.dto.js'
import { RegisterDTO } from './dto/register.dto.js'
import { MysqlConfig } from '@/infrastructure/mysql.js'

@injectable()
export class AuthRepo {
  constructor(@inject(MysqlConfig) private mysqlConfig: MysqlConfig) {}

  /**
   * 使用用户名登录
   */
  async loginByUsername(username: string) {
    return (
      await this.mysqlConfig.query<{
        uid: number
        username: string
        password: string
      }>('SELECT uid,username,password FROM users WHERE username=?', username)
    )[0]
  }

  /**
   * 使用邮箱登录
   */
  async loginByEmail(email: string) {
    return (
      await this.mysqlConfig.query<{
        uid: number
        username: string
        password: string
      }>('SELECT uid,username,password FROM users WHERE email=?', email)
    )[0]
  }

  /**
   * 检查用户是否存在
   */
  async isUserExists(usernmae: string) {
    return (
      await this.mysqlConfig.execute<{ exist: 1 | 0 }[]>(
        `SELECT EXISTS(
          SELECT 1 FROM users WHERE username = ?
        ) AS exist`,
        usernmae
      )
    )[0].exist === 1
      ? true
      : false
  }

  /**
   * 插入用户
   */
  async createUser(username: string, password: string) {
    this.mysqlConfig.execute(
      'INSERT INTO users (username,password) VALUES (?,?)',
      username,
      password
    )
  }

  /**
   * 查询用户档案
   */
  async selectUser(uid: number) {
    return (
      await this.mysqlConfig.query<{
        username: string
        email: string
        avatar: string
        status: -1 | 0 | 1
        role: 0 | 1
        create_time: Date
      }>(
        `SELECT username,email,avatar,status,role,create_time
          FROM users
          WHERE uid = ?`,
        uid
      )
    )[0]
  }

  /**
   * 修改用户邮箱
   */
  async updateEmail(uid: number, email: string) {
    this.mysqlConfig.execute(
      `UPDATE users SET email = ? WHERE uid = ?`,
      email,
      uid
    )
  }

  /**
   * 修改用户头像
   */
  async updateAvatar(uid: number, avatar: string) {
    this.mysqlConfig.execute(
      `UPDATE users SET avatar = ? WHERE uid = ?`,
      avatar,
      uid
    )
  }
}
