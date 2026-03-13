import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf
} from 'class-validator'

export class LoginDTO {
  @IsString({ message: '用户名必须是字符串' })
  @IsOptional({ message: '用户名不能为空' })
  username: string | undefined = undefined

  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsString({ message: '邮箱必须是字符串' })
  @IsNotEmpty({ message: '用户名或邮箱至少存在一个' })
  @ValidateIf((o: LoginDTO) => !o.username)
  email = ''

  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password = ''
}
