import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Request,
  Valid
} from '@auroravpn/fastify-inversify'
import { inject } from 'inversify'
import { AuthService } from './auth.service.js'
import { LoginDTO } from './dto/login.dto.js'
import { RegisterDTO } from './dto/register.dto.js'
import { EditDTO } from './dto/edit.dto.js'

@Controller('/auth')
export class AuthController {
  constructor(@inject(AuthService) private authService: AuthService) {}

  @Post('/login')
  async login(@Valid(LoginDTO) @Body() user: LoginDTO) {
    return {
      token: await this.authService.login(user)
    }
  }

  @Post('/register')
  async register(@Valid(RegisterDTO) @Body() user: RegisterDTO) {
    return await this.authService.register(user)
  }

  @Get('/profile')
  async getProfile(@Request() request: { uid: number }) {
    return await this.authService.getProfile(request.uid)
  }

  @Put('/edit')
  async editProfile(
    @Valid(EditDTO) @Body() user: EditDTO,
    @Request() request: { uid: number }
  ) {
    return await this.authService.editProfile(request.uid, user)
  }
}
