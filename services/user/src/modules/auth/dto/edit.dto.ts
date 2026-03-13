import {
  IsDataURI,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf
} from 'class-validator'

export class EditDTO {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsString({ message: '邮箱必须是字符串' })
  @IsOptional()
  email: string | undefined = undefined

  @IsDataURI({ message: '头像格式必须是DataURL' })
  @IsString({ message: '头像是必须是字符串' })
  @IsNotEmpty({ message: '请求体不能为空' })
  @ValidateIf((o: EditDTO) => !o.email)
  avatar: string | undefined = undefined
}
