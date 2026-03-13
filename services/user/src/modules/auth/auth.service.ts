import { inject, injectable } from 'inversify'
import { LoginDTO } from './dto/login.dto.js'
import { RegisterDTO } from './dto/register.dto.js'
import { AuthRepo } from './auth.repo.js'
import { BusinessError, JwtUtil } from '@packages/common'
import bcrypt from 'bcrypt'
import { EditDTO } from './dto/edit.dto.js'

@injectable()
export class AuthService {
  constructor(@inject(AuthRepo) private authRepo: AuthRepo) {}

  async login(user: LoginDTO) {
    let res: { username: string; uid: number; password: string }
    // username和email至少存在一个
    if (user.username) {
      res = await this.authRepo.loginByUsername(user.username)
    } else {
      res = await this.authRepo.loginByEmail(user.email)
    }
    if (!res) throw new BusinessError('用户名不存在')

    // 校验密码哈希
    const valid = await bcrypt.compare(user.password, res.password)
    if (!valid) throw new BusinessError('密码不正确')

    // 生成token并返回
    const payload = {
      uid: res.uid,
      username: res.username
    }
    return JwtUtil.sign(payload)
  }

  async register(user: RegisterDTO) {
    // 检查用户名是否被占用
    const res = await this.authRepo.isUserExists(user.username)

    if (res) {
      throw new BusinessError('用户名已存在')
    }
    // 生成密码哈希
    const hash = await bcrypt.hash(user.password, 10)
    this.authRepo.createUser(user.username, hash)
  }

  async getProfile(uid: number) {
    return this.authRepo.selectUser(uid)
  }

  async editProfile(uid: number, user: EditDTO) {
    if (user.email) {
      this.authRepo.updateEmail(uid, user.email)
    }
    if (user.avatar) {
      this.authRepo.updateAvatar(uid, user.avatar)
    }
  }
}
