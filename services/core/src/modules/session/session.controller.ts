import {
  IOSocket,
  Message,
  Socket,
  Controller as SocketController
} from '@auroravpn/socket.io-inversify'
import { inject } from 'inversify'
import { SessionService } from './session.service.js'
import { SocketConfig } from '@/infrastructure/socket.js'

@SocketController()
export class SessionController {
  constructor(
    @inject(SessionService) private sessionService: SessionService,
    @inject(SocketConfig) private socketConfig: SocketConfig
  ) {}

  @Message('connect')
  async connect(@Socket() socket: any) {
    this.socketConfig.add(socket.uid, socket.id)
    socket.emit('peer-config', socket.configs)
  }

  @Message('disconnect')
  async disconnect(@Socket() socket: { sid: number }) {
    this.sessionService.disconnect(socket.sid)
  }

  @Message('data-usage')
  async getTraffic(@Socket() socket: { uid: number }) {
    const dataLeft = await this.sessionService.getDataLeft(socket.uid)
    return { dataLeft }
  }
}
