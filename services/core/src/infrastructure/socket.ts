import { InversifySocketIO } from '@auroravpn/socket.io-inversify'

export interface Socket {
  socketIds: string[]
}

export class SocketConfig {
  ioApp: InversifySocketIO | null = null
  sockets = new Map<number, Socket>()

  initSocketConfig(ioApp: InversifySocketIO) {
    this.ioApp = ioApp
  }

  add(uid: number, socketId: string) {
    const user = this.sockets.get(uid)
    if (user) {
      return user.socketIds.push(socketId)
    }
    this.sockets.set(uid, { socketIds: [socketId] })
  }
}
