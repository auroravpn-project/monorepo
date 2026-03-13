import { InversifyFastify, errorCodes } from '@auroravpn/fastify-inversify'

import { ConfigService } from './config/index.js'
import { Container } from 'inversify'
import { MysqlConfig } from './infrastructure/mysql.js'
import { AuthController } from './modules/auth/auth.controller.js'
import { AuthService } from './modules/auth/auth.service.js'
import { AuthRepo } from './modules/auth/auth.repo.js'
import { HTTPHelper, JwtUtil, UnauthorizedError } from '@packages/common'
import { ServiceDiscovery } from '@packages/sd'

const container = new Container()

container.bind(ConfigService).toSelf().inSingletonScope()
container.bind(MysqlConfig).toSelf().inSingletonScope()
container.bind(AuthController).toSelf().inRequestScope()
container.bind(AuthService).toSelf().inRequestScope()
container.bind(AuthRepo).toSelf().inRequestScope()

const RequestInterceptor = (request: any) => {
  const auth = ['/auth/register', '/auth/login']
  if (!auth.includes(request.url)) {
    const token = request.headers.authorization
    if (!token) {
      throw new UnauthorizedError('身份校验失败')
    }
    try {
      const payload = JwtUtil.verify<{ uid: number }>(token)
      ;(request as any).uid = payload.uid
    } catch (error) {
      throw new UnauthorizedError('身份校验失败')
    }
  }
}

const ExceptionInterceptor = (error: any) => {
  const status = error.status || 500
  const response = {
    payload: {
      status,
      message: error.message,
      data: null
    },
    status
  }

  if (error.code === errorCodes.VALIDATION_FAILED) {
    response.status = 400
    response.payload.status = 400
  }

  if (error.code === errorCodes.INVALID_CONTENT_TYPE_ERROR) {
    response.status = 415
    response.payload.status = 415
  }

  if (error.code === errorCodes.INVALID_JSON_BODY) {
    response.status = 400
    response.payload.status = 400
  }

  if (response.status === 500) {
    console.error(error)
  }

  return response
}

const ResponseInterceptor = (payload: unknown) => {
  return {
    status: 200,
    data: payload,
    message: 'success'
  }
}

async function bootstrap() {
  try {
    // 获取服务配置
    const configService = container.get(ConfigService)
    await configService.pullConsulConfig()
    const {
      server: { host, port }
    } = configService.getConfigs()

    // 注册服务
    ServiceDiscovery.registerServer('user-service', host, port)

    // 创建应用
    const app = new InversifyFastify(container as any)
    app.setRequestInterceptor(RequestInterceptor)
    app.setExceptionInterceptor(ExceptionInterceptor)
    app.setResponseInterceptor(ResponseInterceptor)

    // 启动应用
    const server = app.build()
    await app.ready()
    const PORT = Number(process.env.APP_PORT) || 3001
    const HOST = '0.0.0.0'
    const helper = new HTTPHelper(server)
    helper.healthcheck()
    helper.listen({ port: PORT, hostname: HOST }, () => {
      console.log(`User service is running at http://${host}:${port}`)
    })
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

bootstrap()
