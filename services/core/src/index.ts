import { Container } from 'inversify'
import { ServiceDiscovery } from '@packages/sd'
import { errorCodes, InversifyFastify } from '@auroravpn/fastify-inversify'
import { InversifySocketIO } from '@auroravpn/socket.io-inversify'
import { HTTPHelper, JwtUtil, UnauthorizedError } from '@packages/common'

import { ConfigService } from './config/index.js'
import { MysqlConfig } from './infrastructure/mysql.js'
import { RedisConfig } from './infrastructure/redis.js'
import { SocketConfig } from './infrastructure/socket.js'
import { WireguardConfig } from './infrastructure/wireguard.js'

import { DataController } from './modules/data/data.controller.js'
import { DataService } from './modules/data/data.service.js'
import { DataRepo } from './modules/data/data.repo.js'
import { SessionController } from './modules/session/session.controller.js'
import { SessionService } from './modules/session/session.service.js'
import { SessionRepo } from './modules/session/session.repo.js'
import { TrafficService } from './modules/traffic/traffic.service.js'
import { TrafficRepo } from './modules/traffic/traffic.repo.js'
import { InversifyBullmq } from '@auroravpn/bullmq-inversify'
import { RedisClient } from '@packages/db'

export const container = new Container()

container.bind(ConfigService).toSelf().inSingletonScope()
container.bind(MysqlConfig).toSelf().inSingletonScope()
container.bind(RedisConfig).toSelf().inSingletonScope()
container.bind(SocketConfig).toSelf().inSingletonScope()
container.bind(WireguardConfig).toSelf().inSingletonScope()

container.bind(DataController).toSelf().inRequestScope()
container.bind(DataService).toSelf().inRequestScope()
container.bind(DataRepo).toSelf().inRequestScope()
container.bind(SessionController).toSelf().inSingletonScope()
container.bind(SessionService).toSelf().inSingletonScope()
container.bind(SessionRepo).toSelf().inSingletonScope()
container.bind(TrafficService).toSelf().inSingletonScope()
container.bind(TrafficRepo).toSelf().inSingletonScope()

// SocketIO身份验证中间件
const IOMiddleware = async (socket: any, next: (err?: Error) => void) => {
  // 检查身份校验参数是否存在
  const { token, publicKey } = socket.handshake.auth
  if (!token || !publicKey) {
    return next(new Error('身份校验失败'))
  }

  // 验证token令牌是否合法
  try {
    const { uid } = JwtUtil.verify<{ uid: number }>(token)
    socket.uid = uid
  } catch {
    return next(new Error('身份验证失败'))
  }

  // 验证公钥格式是否正确
  const regex = /^[A-Za-z0-9+/]{43,44}=?$/
  if (!regex.test(publicKey)) {
    return next(new Error('身份验证失败'))
  }

  // 启动连接
  try {
    const sessionService = container.get(SessionService)
    const { sid, configs } = await sessionService.connect(socket.uid, publicKey)
    socket.sid = sid
    socket.configs = configs
  } catch (err: any) {
    return next(err)
  }
  // 放行
  next()
}

// Fastify请求拦截器
const RequestInterceptor = (request: any) => {
  const { authorization } = request.headers
  if (request.url)
    if (!authorization) {
      throw new UnauthorizedError('身份校验失败')
    }
  try {
    const { uid } = JwtUtil.verify<{ uid: number }>(authorization)
    ;(request as any).uid = uid
  } catch (error) {
    throw new UnauthorizedError('身份校验失败')
  }
}

// Fastify错误拦截器
const ExceptionInterceptor = (error: any) => {
  const status = error.status || error.statusCode || 500
  const response = {
    payload: {
      status,
      message: error.message
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

// Fastify响应拦截器
const ResponseInterceptor = (payload: unknown) => {
  return {
    status: 200,
    message: 'success',
    data: payload
  }
}

async function bootstrap() {
  try {
    // 拉取服务配置
    const configService = container.get(ConfigService)
    await configService.pullConsulConfig()
    const {
      server: { host, port },
      database: { redis }
    } = configService.getConfigs()

    // 注册服务
    ServiceDiscovery.registerServer('core-service', host, port)

    // 创建应用
    const app = new InversifyFastify(container as any)
    const server = app.build()

    const ioApp = new InversifySocketIO(container as any, server)

    const mq = new InversifyBullmq(container as any, {
      host: redis.host,
      port: redis.port,
      db: 0,
      maxRetriesPerRequest: null
    })

    // 挂载中间件
    app.setRequestInterceptor(RequestInterceptor)
    app.setExceptionInterceptor(ExceptionInterceptor)
    app.setResponseInterceptor(ResponseInterceptor)
    ioApp.setMiddleware(IOMiddleware)

    // 初始化Socket配置
    const socketConfig = container.get(SocketConfig)
    socketConfig.initSocketConfig(ioApp)

    // 启动服务
    mq.start()
    await app.ready()
    const HOST = '0.0.0.0'
    const PORT = Number(process.env.APP_PORT) || 3002
    const helper = new HTTPHelper(server)
    helper.healthcheck()
    helper.listen({ port: PORT, hostname: HOST }, async () => {
      console.log(`Core Service is running at http://${HOST}:${PORT}`)
    })
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

bootstrap()
