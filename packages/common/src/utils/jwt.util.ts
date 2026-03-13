import jsonwebtoken from 'jsonwebtoken'

export class JwtUtil {
  static readonly JWT_SECRET = 'auroravpn'

  static verify<T = object>(str: string) {
    const token = str.split(' ')[1]
    return jsonwebtoken.verify(token, this.JWT_SECRET) as T
  }

  static sign(payload: object) {
    const token = jsonwebtoken.sign(payload, this.JWT_SECRET)
    return token
  }
}
