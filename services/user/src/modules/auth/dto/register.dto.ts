import { IsNotEmpty, IsString, Matches } from 'class-validator'

export class RegisterDTO {
  @Matches(/^[A-Za-z0-9_]{4,20}$/, {
    message: '用户名只能包含字母、数字、下划线，长度 4-20'
  })
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  username = ''

  @Matches(/^[A-Za-z\d!@#$%^&*_\-+=?.]{8,32}$/, {
    message: '密码只能包含数字、字母、特殊字符（@#$%^&*_\\-+=?），长度为 8-32'
  })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password = ''
}
